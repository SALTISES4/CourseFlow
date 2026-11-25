from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.application.project_transfer.service import (
    ProjectImportService,
)
from course_flow.application.services.authorization_service import (
    AuthorizationService,
)
from course_flow.application.services.project_copy_service import (
    ProjectCopyService,
)
from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import AccountRole, NodeType, TeamRole, WorkflowType
from course_flow.core.models import (
    Authtoken,
    Channel,
    Comment,
    Discipline,
    Edge,
    FavoriteGraph,
    FavoriteProject,
    Graph,
    Horizontaloutcome,
    Node,
    Outcome,
    Project,
    Section,
    Tag,
    TeamUser,
    Workflow,
    WorkspaceEditLock,
)
from course_flow.infrastructure.project_transfer import (
    DjangoProjectSnapshotExporter,
)


def _user(email: str):
    return get_user_model().objects.create_user(
        email=email,
        password="password",
        account_role=AccountRole.TEACHER,
    )


def _token(user) -> str:
    raw = generate_raw_token()
    now = timezone.now()
    Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw),
        expires_at=now + timedelta(hours=1),
        last_used_at=now,
    )
    return raw


def _auth(user) -> dict[str, str]:
    return {"HTTP_AUTHORIZATION": f"Bearer {_token(user)}"}


def _post_copy(
    client: Client,
    *,
    actor,
    source: Project,
    title: str = "Copied project",
    include_archived_workflows: bool = False,
):
    return client.post(
        f"/api/project/{source.uuid}/copy",
        data={
            "title": title,
            "includeArchivedWorkflows": include_archived_workflows,
        },
        content_type="application/json",
        **_auth(actor),
    )


def _workflow(
    *,
    author,
    project: Project,
    title: str,
    workflow_type: WorkflowType,
    is_archived: bool = False,
    public_link_enabled: bool = False,
) -> Workflow:
    return Workflow.objects.create(
        graph=Graph.objects.create(),
        author=author,
        project=project,
        title=title,
        description=f"{title} description",
        workflow_type=workflow_type,
        is_archived=is_archived,
        public_link_enabled=public_link_enabled,
    )


def _build_rich_source(*, owner, actor) -> dict[str, object]:
    discipline = Discipline.objects.create(code="project-copy")
    source = Project.objects.create(
        owner=owner,
        title="Source project",
        description="Source description",
        is_published=True,
        is_template=True,
    )
    source.disciplines.add(discipline)
    TeamUser.objects.create(
        team=source.team,
        user=actor,
        role=TeamRole.VIEWER,
    )
    tag = Tag.objects.create(
        project=source,
        label="Assessment",
        translation_plural="Assessments",
    )
    Tag.objects.create(
        project=source,
        label="Unused",
        translation_plural="Unused",
    )

    linked = _workflow(
        author=owner,
        project=source,
        title="Linked activity",
        workflow_type=WorkflowType.ACTIVITY,
        is_archived=True,
        public_link_enabled=True,
    )
    linked_section = Section.objects.create(
        graph=linked.graph,
        title="Tasks",
        position=0,
    )
    Channel.objects.create(
        graph=linked.graph,
        title="Work",
        colour="#112233",
        position=0,
    )
    Comment.objects.create(
        author=owner,
        thread=linked_section.thread,
        body="Do not copy",
    )

    main = _workflow(
        author=owner,
        project=source,
        title="Main course",
        workflow_type=WorkflowType.COURSE,
        public_link_enabled=True,
    )
    main.coursemeta.classification = "Required"
    main.coursemeta.code = "COPY-101"
    main.coursemeta.save(update_fields=["classification", "code"])
    section = Section.objects.create(graph=main.graph, title="Week 1", position=0)
    channel = Channel.objects.create(
        graph=main.graph,
        title="Students",
        colour="#445566",
        position=0,
    )
    first = Node.objects.create(
        section=section,
        channel=channel,
        workflow=main,
        linked_workflow=linked,
        section_row=0,
        node_type=NodeType.ACTIVITY,
        title="Linked node",
    )
    first.activitymeta.time_required_minutes = 90
    first.activitymeta.save(update_fields=["time_required_minutes"])
    second = Node.objects.create(
        section=section,
        channel=channel,
        workflow=main,
        section_row=1,
        node_type=NodeType.ACTIVITY,
        title="Second node",
    )
    first.tags.add(tag)
    root = Outcome.objects.create(graph=main.graph, order=0, title="Root")
    child = Outcome.objects.create(
        graph=main.graph,
        parent=root,
        order=0,
        title="Child",
    )
    child.tags.add(tag)
    first.outcomes.add(child)
    Edge.objects.create(
        source_node=first,
        target_node=second,
        title="Dependency",
        source_port="right",
        target_port="left",
    )
    horizontal = Horizontaloutcome.objects.create()
    horizontal.outcomes.add(root, child)
    Comment.objects.create(author=owner, thread=first.thread, body="Do not copy")

    FavoriteProject.objects.create(user=actor, project=source)
    FavoriteGraph.objects.create(user=actor, graph=main.graph)
    WorkspaceEditLock.objects.create(
        project=source,
        holder=owner,
        expires_at=timezone.now() + timedelta(minutes=5),
    )
    return {
        "project": source,
        "tag": tag,
        "main": main,
        "linked": linked,
        "first": first,
    }


@pytest.mark.django_db
def test_copy_project_preserves_content_and_remaps_project_relations():
    owner = _user("project-copy-owner@example.com")
    actor = _user("project-copy-viewer@example.com")
    source = _build_rich_source(owner=owner, actor=actor)

    response = _post_copy(
        Client(),
        actor=actor,
        source=source["project"],
        title="  Copied curriculum  ",
        include_archived_workflows=True,
    )

    assert response.status_code == 200, response.content
    payload = response.json()
    copied = Project.objects.get(uuid=payload["uuid"])
    assert copied.uuid != source["project"].uuid
    assert copied.owner == actor
    assert copied.title == "Copied curriculum"
    assert copied.description == source["project"].description
    assert copied.is_published is False
    assert copied.is_archived is False
    assert copied.is_template is False
    assert list(copied.disciplines.values_list("code", flat=True)) == ["project-copy"]
    assert payload["permissions"]["resourceRole"] == "owner"
    assert payload["isFavorite"] is False

    assert set(copied.tags.values_list("label", flat=True)) == {
        "Assessment",
        "Unused",
    }
    copied_tag = copied.tags.get(label="Assessment")
    assert copied_tag.id != source["tag"].id
    assert (copied_tag.label, copied_tag.translation_plural) == (
        "Assessment",
        "Assessments",
    )
    copied_main = copied.workflows.get(title="Main course")
    copied_linked = copied.workflows.get(title="Linked activity")
    assert copied_main.author == actor
    assert copied_linked.author == actor
    assert copied_main.public_link_enabled is False
    assert copied_linked.public_link_enabled is False
    assert copied_main.is_archived is False
    assert copied_linked.is_archived is True
    assert copied_main.graph_id != source["main"].graph_id

    copied_first = copied_main.nodes.select_related("activitymeta").get(
        title="Linked node"
    )
    copied_second = copied_main.nodes.get(title="Second node")
    assert copied_first.linked_workflow == copied_linked
    assert copied_first.linked_workflow != source["linked"]
    assert copied_first.activitymeta.time_required_minutes == 90
    assert list(copied_first.tags.values_list("id", flat=True)) == [copied_tag.id]
    copied_child = copied_main.graph.outcomes.get(title="Child")
    assert copied_child.parent.title == "Root"
    assert list(copied_child.tags.values_list("id", flat=True)) == [copied_tag.id]
    assert list(copied_first.outcomes.values_list("title", flat=True)) == ["Child"]
    assert Edge.objects.filter(
        source_node=copied_first,
        target_node=copied_second,
        title="Dependency",
    ).exists()
    assert (
        Horizontaloutcome.objects.filter(outcomes__graph=copied_main.graph)
        .distinct()
        .count()
        == 1
    )

    copied_thread_ids = list(copied_main.nodes.values_list("thread_id", flat=True))
    copied_thread_ids += list(
        copied_main.graph.sections.values_list("thread_id", flat=True)
    )
    assert not Comment.objects.filter(thread_id__in=copied_thread_ids).exists()
    assert not TeamUser.objects.filter(team=copied.team).exists()
    assert not FavoriteProject.objects.filter(project=copied).exists()
    assert not FavoriteGraph.objects.filter(graph__workflow__project=copied).exists()
    assert not WorkspaceEditLock.objects.filter(project=copied).exists()

    source["first"].refresh_from_db()
    assert source["first"].linked_workflow == source["linked"]
    assert TeamUser.objects.filter(team=source["project"].team, user=actor).exists()


@pytest.mark.django_db
def test_copy_project_excludes_archived_workflows_and_severs_omitted_links():
    owner = _user("project-copy-archived-owner@example.com")
    actor = _user("project-copy-archived-viewer@example.com")
    source = _build_rich_source(owner=owner, actor=actor)

    response = _post_copy(
        Client(),
        actor=actor,
        source=source["project"],
    )

    assert response.status_code == 200, response.content
    copied = Project.objects.get(uuid=response.json()["uuid"])
    assert list(copied.workflows.values_list("title", flat=True)) == ["Main course"]
    copied_node = (
        copied.workflows.get()
        .nodes.select_related("activitymeta")
        .get(title="Linked node")
    )
    assert copied_node.linked_workflow is None
    assert copied_node.activitymeta.time_required_minutes == 90
    source["first"].refresh_from_db()
    assert source["first"].linked_workflow == source["linked"]


@pytest.mark.django_db
def test_copy_project_silently_severs_link_outside_source_project():
    owner = _user("project-copy-external-link-owner@example.com")
    source = Project.objects.create(owner=owner, title="External-link source")
    external_project = Project.objects.create(owner=owner, title="External target")
    external = _workflow(
        author=owner,
        project=external_project,
        title="External activity",
        workflow_type=WorkflowType.ACTIVITY,
    )
    main = _workflow(
        author=owner,
        project=source,
        title="Source course",
        workflow_type=WorkflowType.COURSE,
    )
    section = Section.objects.create(graph=main.graph, title="Week", position=0)
    channel = Channel.objects.create(
        graph=main.graph,
        title="Work",
        colour="#123456",
        position=0,
    )
    source_node = Node.objects.create(
        section=section,
        channel=channel,
        workflow=main,
        linked_workflow=external,
        section_row=0,
        node_type=NodeType.ACTIVITY,
        title="Invalid external link",
    )
    source_node.activitymeta.time_required_minutes = 45
    source_node.activitymeta.save(update_fields=["time_required_minutes"])

    response = _post_copy(Client(), actor=owner, source=source)

    assert response.status_code == 200, response.content
    copied = Project.objects.get(uuid=response.json()["uuid"])
    copied_node = copied.workflows.get().nodes.select_related("activitymeta").get()
    assert copied_node.linked_workflow is None
    assert copied_node.activitymeta.time_required_minutes == 45
    source_node.refresh_from_db()
    assert source_node.linked_workflow == external


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [None, TeamRole.EDITOR, TeamRole.COMMENTER, TeamRole.VIEWER],
)
def test_active_project_contributor_roles_can_copy(role):
    owner = _user(f"project-copy-role-owner-{role or 'owner'}@example.com")
    actor = owner if role is None else _user(f"project-copy-role-{role}@example.com")
    source = Project.objects.create(owner=owner, title="Role source")
    if role is not None:
        TeamUser.objects.create(team=source.team, user=actor, role=role)

    response = _post_copy(Client(), actor=actor, source=source)

    assert response.status_code == 200, response.content
    assert Project.objects.get(uuid=response.json()["uuid"]).owner == actor


@pytest.mark.django_db
def test_published_template_public_user_can_copy_but_other_public_project_cannot():
    owner = _user("project-copy-public-owner@example.com")
    actor = _user("project-copy-public-actor@example.com")
    template = Project.objects.create(
        owner=owner,
        title="Template",
        is_published=True,
        is_template=True,
    )
    non_template = Project.objects.create(
        owner=owner,
        title="Published project",
        is_published=True,
    )

    allowed = _post_copy(Client(), actor=actor, source=template)
    denied = _post_copy(Client(), actor=actor, source=non_template)

    assert allowed.status_code == 200, allowed.content
    assert denied.status_code == 403


@pytest.mark.django_db
def test_archived_project_is_not_copyable_even_by_owner_or_admin():
    owner = _user("project-copy-archived-project-owner@example.com")
    admin = _user("project-copy-archived-project-admin@example.com")
    admin.set_account_role(AccountRole.ADMIN)
    source = Project.objects.create(
        owner=owner,
        title="Archived source",
        is_archived=True,
    )

    assert _post_copy(Client(), actor=owner, source=source).status_code == 403
    assert _post_copy(Client(), actor=admin, source=source).status_code == 403
    assert Project.objects.count() == 1


@pytest.mark.django_db
def test_copy_project_validates_request_and_creates_distinct_retries():
    owner = _user("project-copy-validation-owner@example.com")
    source = Project.objects.create(owner=owner, title="Validation source")
    client = Client()

    missing = client.post(
        f"/api/project/{uuid4()}/copy",
        data={"title": "Missing"},
        content_type="application/json",
        **_auth(owner),
    )
    omitted_title = client.post(
        f"/api/project/{source.uuid}/copy",
        data={},
        content_type="application/json",
        **_auth(owner),
    )
    blank = _post_copy(client, actor=owner, source=source, title="   ")
    too_long = _post_copy(client, actor=owner, source=source, title="x" * 201)
    non_boolean = client.post(
        f"/api/project/{source.uuid}/copy",
        data={"title": "Invalid", "includeArchivedWorkflows": "true"},
        content_type="application/json",
        **_auth(owner),
    )
    first = _post_copy(client, actor=owner, source=source, title="Retry")
    second = _post_copy(client, actor=owner, source=source, title="Retry")

    assert missing.status_code == 404
    assert omitted_title.status_code == 422
    assert blank.status_code == 422
    assert too_long.status_code == 422
    assert non_boolean.status_code == 422
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["uuid"] != second.json()["uuid"]


@pytest.mark.django_db
def test_copy_project_rolls_back_partial_destination_on_failure():
    owner = _user("project-copy-rollback-owner@example.com")
    source = Project.objects.create(owner=owner, title="Rollback source")

    class FailingWriter:
        def write(self, *, snapshot, owner_id, identity_policy):
            Project.objects.create(owner_id=owner_id, title="Partial destination")
            raise RuntimeError("forced project-copy failure")

    service = ProjectCopyService(
        authorization=AuthorizationService(),
        exporter=DjangoProjectSnapshotExporter(),
        importer=ProjectImportService(FailingWriter()),
    )

    with pytest.raises(RuntimeError, match="forced project-copy failure"):
        service.copy(
            source_project_uuid=source.uuid,
            title="Must roll back",
            include_archived_workflows=False,
            actor=owner,
        )

    assert list(Project.objects.values_list("title", flat=True)) == ["Rollback source"]
