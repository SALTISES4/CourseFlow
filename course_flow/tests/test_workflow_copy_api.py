from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.application.services.workflow_copy_service import (
    WorkflowCopyService,
)
from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import AccountRole, NodeType, TeamRole, WorkflowType
from course_flow.core.models import (
    Authtoken,
    Channel,
    Comment,
    Edge,
    Graph,
    Node,
    NodeOutcome,
    NodeTag,
    Outcome,
    OutcomeTag,
    Project,
    Section,
    Tag,
    TeamUser,
    Thread,
    Workflow,
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


def _auth(raw: str) -> dict[str, str]:
    return {"HTTP_AUTHORIZATION": f"Bearer {raw}"}


def _project(owner, title: str, *, is_template=False, is_published=False):
    return Project.objects.create(
        owner=owner,
        title=title,
        is_template=is_template,
        is_published=is_published,
    )


def _workflow(owner, project, title: str, workflow_type=WorkflowType.COURSE):
    graph = Graph.objects.create()
    workflow = Workflow.objects.create(
        graph=graph,
        author=owner,
        project=project,
        title=title,
        description="Source description",
        workflow_type=workflow_type,
    )
    return graph, workflow


def _build_source(owner, project):
    graph, source = _workflow(owner, project, "Source course")
    source.coursemeta.classification = "Required"
    source.coursemeta.code = "COPY-101"
    source.coursemeta.save(update_fields=["classification", "code"])

    linked_graph, linked = _workflow(
        owner,
        project,
        "Linked activity",
        WorkflowType.ACTIVITY,
    )
    assert linked_graph.pk is not None

    section_a = Section.objects.create(graph=graph, title="Section A", position=0)
    section_b = Section.objects.create(graph=graph, title="Section B", position=1)
    channel_a = Channel.objects.create(
        graph=graph,
        title="Theory",
        colour="#112233",
        position=0,
    )
    channel_b = Channel.objects.create(
        graph=graph,
        title="Practice",
        colour="#445566",
        position=1,
    )
    node_a = Node.objects.create(
        section=section_a,
        channel=channel_a,
        workflow=source,
        linked_workflow=linked,
        section_row=0,
        node_type=NodeType.ACTIVITY,
        title="Node A",
        description="Node A description",
    )
    node_b = Node.objects.create(
        section=section_b,
        channel=channel_b,
        workflow=source,
        section_row=2,
        node_type=NodeType.ACTIVITY,
        title="Node B",
        description="Node B description",
    )
    node_a.activitymeta.context_classification = 3
    node_a.activitymeta.task_classification = 4
    node_a.activitymeta.time_required = "2.50"
    node_a.activitymeta.time_units = 2
    node_a.activitymeta.represents_workflow = True
    node_a.activitymeta.context = "Seminar"
    node_a.activitymeta.classification = "Formative"
    node_a.activitymeta.save()

    tag = Tag.objects.create(project=project, label="Pedagogy")
    node_a.tags.add(tag)

    root = Outcome.objects.create(
        graph=graph,
        order=0,
        title="Root outcome",
        description="Root description",
        code="R1",
    )
    child = Outcome.objects.create(
        graph=graph,
        parent=root,
        order=0,
        title="Child outcome",
        description="Child description",
        code="C1",
    )
    root.tags.add(tag)
    child.tags.add(tag)
    NodeOutcome.objects.create(node=node_a, outcome=root)
    NodeOutcome.objects.create(node=node_b, outcome=child)
    Edge.objects.create(
        source_node=node_a,
        target_node=node_b,
        title="A to B",
        text_position=37,
        line_type="solid",
        source_port="right",
        target_port="left",
    )
    Comment.objects.create(author=owner, thread=node_a.thread, body="Do not copy")
    Comment.objects.create(author=owner, thread=section_a.thread, body="Do not copy")
    Comment.objects.create(author=owner, thread=root.thread, body="Do not copy")

    return {
        "graph": graph,
        "workflow": source,
        "linked": linked,
        "tag": tag,
        "node_a": node_a,
        "node_b": node_b,
        "root": root,
        "child": child,
    }


def _post_copy(client, *, actor, source, destination, title="Copied course"):
    return client.post(
        f"/api/workflow/{source.uuid}/copy",
        data={"projectUuid": str(destination.uuid), "title": title},
        content_type="application/json",
        **_auth(_token(actor)),
    )


@pytest.mark.django_db
def test_copy_workflow_same_project_preserves_full_content_fidelity():
    owner = _user("copy-owner@example.com")
    project = _project(owner, "Source project")
    source = _build_source(owner, project)

    response = _post_copy(
        Client(),
        actor=owner,
        source=source["workflow"],
        destination=project,
    )

    assert response.status_code == 200, response.content
    payload = response.json()
    copied = Workflow.objects.select_related("graph", "coursemeta").get(
        uuid=payload["uuid"]
    )
    assert copied.uuid != source["workflow"].uuid
    assert copied.graph_id != source["graph"].id
    assert copied.author == owner
    assert copied.project == project
    assert copied.title == "Copied course"
    assert copied.description == source["workflow"].description
    assert copied.coursemeta.classification == "Required"
    assert copied.coursemeta.code == "COPY-101"
    assert payload["permissions"]["resourceRole"] == "owner"

    sections = list(copied.graph.sections.order_by("position"))
    channels = list(copied.graph.channels.order_by("position"))
    assert [(row.title, row.position) for row in sections] == [
        ("Section A", 0),
        ("Section B", 1),
    ]
    assert [(row.title, row.colour, row.position) for row in channels] == [
        ("Theory", "#112233", 0),
        ("Practice", "#445566", 1),
    ]

    copied_a = copied.nodes.select_related("activitymeta", "linked_workflow").get(
        title="Node A"
    )
    copied_b = copied.nodes.get(title="Node B")
    assert copied_a.uuid != source["node_a"].uuid
    assert copied_a.section.title == "Section A"
    assert copied_a.channel.title == "Theory"
    assert copied_a.section_row == 0
    assert copied_a.linked_workflow == source["linked"]
    assert copied_a.activitymeta.context_classification == 3
    assert copied_a.activitymeta.task_classification == 4
    assert copied_a.activitymeta.context == "Seminar"
    assert copied_a.activitymeta.classification == "Formative"
    assert list(copied_a.tags.values_list("label", flat=True)) == ["Pedagogy"]

    edge = Edge.objects.get(source_node=copied_a, target_node=copied_b)
    assert (
        edge.title,
        edge.text_position,
        edge.line_type,
        edge.source_port,
        edge.target_port,
    ) == ("A to B", 37, "solid", "right", "left")

    copied_root = copied.graph.outcomes.get(parent=None)
    copied_child = copied.graph.outcomes.get(parent=copied_root)
    assert (copied_root.title, copied_root.code, copied_root.order) == (
        "Root outcome",
        "R1",
        0,
    )
    assert (copied_child.title, copied_child.code, copied_child.order) == (
        "Child outcome",
        "C1",
        0,
    )
    assert copied_a.outcomes.get() == copied_root
    assert copied_b.outcomes.get() == copied_child
    assert list(copied_root.tags.values_list("label", flat=True)) == ["Pedagogy"]

    copied_thread_ids = {
        copied_a.thread_id,
        copied_root.thread_id,
        *(section.thread_id for section in sections),
        *(channel.thread_id for channel in channels),
    }
    assert source["node_a"].thread_id not in copied_thread_ids
    assert Comment.objects.filter(thread_id__in=copied_thread_ids).count() == 0


@pytest.mark.django_db
def test_copy_workflow_cross_project_clears_project_scoped_tags_and_links():
    owner = _user("cross-project-owner@example.com")
    source_project = _project(owner, "Source")
    destination = _project(owner, "Destination", is_published=True)
    source = _build_source(owner, source_project)

    response = _post_copy(
        Client(),
        actor=owner,
        source=source["workflow"],
        destination=destination,
    )

    assert response.status_code == 200, response.content
    copied = Workflow.objects.get(uuid=response.json()["uuid"])
    copied_a = copied.nodes.get(title="Node A")
    copied_root = copied.graph.outcomes.get(parent=None)
    assert copied.project == destination
    assert copied_a.linked_workflow is None
    assert copied_a.tags.count() == 0
    assert copied_root.tags.count() == 0
    assert copied.nodes.count() == 2
    assert copied.graph.outcomes.count() == 2
    assert Edge.objects.filter(source_node__workflow=copied).count() == 1


@pytest.mark.django_db
def test_copy_preserves_activity_workflow_and_task_node_metadata():
    owner = _user("activity-task-meta-copy@example.com")
    project = _project(owner, "Activity metadata")
    graph, source = _workflow(
        owner,
        project,
        "Source activity",
        WorkflowType.ACTIVITY,
    )
    source.activitymeta.context_classification = 7
    source.activitymeta.task_classification = 8
    source.activitymeta.time_required = Decimal("3.25")
    source.activitymeta.time_units = 2
    source.activitymeta.represents_workflow = True
    source.activitymeta.context = "Lab"
    source.activitymeta.classification = "Summative"
    source.activitymeta.save()

    section = Section.objects.create(graph=graph, title="Tasks", position=0)
    channel = Channel.objects.create(
        graph=graph,
        title="Work",
        colour="#123456",
        position=0,
    )
    task = Node.objects.create(
        section=section,
        channel=channel,
        workflow=source,
        section_row=0,
        node_type=NodeType.TASK,
        title="Task node",
    )
    task.taskmeta.context_classification = 9
    task.taskmeta.time_required = Decimal("1.75")
    task.taskmeta.time_units = 1
    task.taskmeta.represents_workflow = True
    task.taskmeta.context = "Independent"
    task.taskmeta.save()

    response = _post_copy(
        Client(),
        actor=owner,
        source=source,
        destination=project,
    )

    assert response.status_code == 200, response.content
    copied = Workflow.objects.select_related("activitymeta").get(
        uuid=response.json()["uuid"]
    )
    assert copied.activitymeta.context_classification == 7
    assert copied.activitymeta.task_classification == 8
    assert copied.activitymeta.time_required == Decimal("3.25")
    assert copied.activitymeta.time_units == 2
    assert copied.activitymeta.represents_workflow is True
    assert copied.activitymeta.context == "Lab"
    assert copied.activitymeta.classification == "Summative"

    copied_task = copied.nodes.select_related("taskmeta").get(title="Task node")
    assert copied_task.taskmeta.context_classification == 9
    assert copied_task.taskmeta.time_required == task.taskmeta.time_required
    assert copied_task.taskmeta.time_units == 1
    assert copied_task.taskmeta.represents_workflow is True
    assert copied_task.taskmeta.context == "Independent"


@pytest.mark.django_db
def test_copy_preserves_program_overview_metadata():
    owner = _user("program-meta-copy@example.com")
    project = _project(owner, "Program metadata")
    _, source = _workflow(
        owner,
        project,
        "Source program",
        WorkflowType.PROGRAM,
    )
    source.programmeta.calculate_time = "enabled"
    source.programmeta.calculate_credits = "manual"
    source.programmeta.calculate_ponderation = "automatic"
    source.programmeta.calculate_classification = "enabled"
    source.programmeta.classification_general_time = timedelta(hours=12)
    source.programmeta.classification_specific_time = timedelta(hours=4)
    source.programmeta.save()

    response = _post_copy(
        Client(),
        actor=owner,
        source=source,
        destination=project,
    )

    assert response.status_code == 200, response.content
    copied = Workflow.objects.select_related("programmeta").get(
        uuid=response.json()["uuid"]
    )
    assert copied.programmeta.calculate_time == "enabled"
    assert copied.programmeta.calculate_credits == "manual"
    assert copied.programmeta.calculate_ponderation == "automatic"
    assert copied.programmeta.calculate_classification == "enabled"
    assert copied.programmeta.classification_general_time == timedelta(hours=12)
    assert copied.programmeta.classification_specific_time == timedelta(hours=4)


@pytest.mark.django_db
def test_viewer_can_copy_visible_source_into_owned_destination():
    source_owner = _user("viewer-copy-source@example.com")
    actor = _user("viewer-copy-actor@example.com")
    source_project = _project(source_owner, "Viewer source")
    destination = _project(actor, "Actor destination")
    TeamUser.objects.create(
        team=source_project.team,
        user=actor,
        role=TeamRole.VIEWER,
    )
    source = _build_source(source_owner, source_project)

    response = _post_copy(
        Client(),
        actor=actor,
        source=source["workflow"],
        destination=destination,
    )

    assert response.status_code == 200, response.content
    copied = Workflow.objects.get(uuid=response.json()["uuid"])
    assert copied.author == actor
    assert copied.project == destination


@pytest.mark.django_db
def test_copy_rejects_destination_where_actor_cannot_create_workflow():
    owner = _user("denied-copy-source@example.com")
    destination_owner = _user("denied-copy-destination@example.com")
    source_project = _project(owner, "Source")
    destination = _project(destination_owner, "Destination")
    TeamUser.objects.create(
        team=destination.team,
        user=owner,
        role=TeamRole.VIEWER,
    )
    source = _build_source(owner, source_project)

    response = _post_copy(
        Client(),
        actor=owner,
        source=source["workflow"],
        destination=destination,
    )

    assert response.status_code == 403
    assert Workflow.objects.filter(project=destination).count() == 0


@pytest.mark.django_db
def test_published_template_can_be_copied_by_non_member_into_owned_project():
    curator = _user("template-curator@example.com")
    actor = _user("template-consumer@example.com")
    template_project = _project(
        curator,
        "Published templates",
        is_template=True,
        is_published=True,
    )
    destination = _project(actor, "Consumer project")
    source = _build_source(curator, template_project)

    response = _post_copy(
        Client(),
        actor=actor,
        source=source["workflow"],
        destination=destination,
        title=source["workflow"].title,
    )

    assert response.status_code == 200, response.content
    copied = Workflow.objects.get(uuid=response.json()["uuid"])
    assert copied.project == destination
    assert copied.author == actor
    assert copied.title == source["workflow"].title
    assert copied.nodes.get(title="Node A").linked_workflow is None


@pytest.mark.django_db
def test_copy_rolls_back_every_created_row_when_graph_clone_fails(monkeypatch):
    owner = _user("rollback-copy@example.com")
    project = _project(owner, "Rollback project")
    source = _build_source(owner, project)
    service = WorkflowCopyService()
    models = (
        Graph,
        Workflow,
        Section,
        Channel,
        Node,
        Outcome,
        Edge,
        Thread,
        NodeTag,
        OutcomeTag,
        NodeOutcome,
    )
    counts_before = {model: model.objects.count() for model in models}

    def fail_copy_edges(**_kwargs):
        raise RuntimeError("forced copy failure")

    monkeypatch.setattr(service, "_copy_edges", fail_copy_edges)

    with pytest.raises(RuntimeError, match="forced copy failure"):
        service.copy(
            source_workflow_uuid=source["workflow"].uuid,
            destination_project_uuid=project.uuid,
            title="Must roll back",
            actor=owner,
        )

    assert {model: model.objects.count() for model in models} == counts_before
    assert not Workflow.objects.filter(title="Must roll back").exists()


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("title", "expected_status"),
    [("   ", 422), ("x" * 201, 422)],
)
def test_copy_validates_explicit_title(title, expected_status):
    owner = _user(f"title-{uuid4()}@example.com")
    project = _project(owner, "Title project")
    _, source = _workflow(owner, project, "Source")

    response = _post_copy(
        Client(),
        actor=owner,
        source=source,
        destination=project,
        title=title,
    )

    assert response.status_code == expected_status
    assert Workflow.objects.filter(project=project).count() == 1
