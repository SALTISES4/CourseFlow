from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import IntegrityError, transaction

from course_flow.application.services.authorization_service import (
    AuthorizationService,
)
from course_flow.core.enum import AccountRole, TeamRole
from course_flow.core.models import Graph, Project, TeamUser, Workflow
from course_flow.core.permissions import (
    ProjectPermission,
    ResourceRole,
    WorkflowPermission,
)


@pytest.fixture
def authorization() -> AuthorizationService:
    return AuthorizationService()


@pytest.fixture
def users():
    User = get_user_model()
    return {
        name: User.objects.create_user(
            email=f"{name}@example.com",
            password="password123",
        )
        for name in ("owner", "author", "editor", "commenter", "viewer", "public")
    }


@pytest.fixture
def project(users) -> Project:
    project = Project.objects.create(owner=users["owner"], title="Permissions")
    for name, role in (
        ("editor", TeamRole.EDITOR),
        ("commenter", TeamRole.COMMENTER),
        ("viewer", TeamRole.VIEWER),
    ):
        TeamUser.objects.create(
            team=project.team,
            user=users[name],
            role=role,
        )
    return project


@pytest.fixture
def workflow(project, users) -> Workflow:
    return Workflow.objects.create(
        graph=Graph.objects.create(),
        project=project,
        author=users["author"],
        title="Permissions workflow",
        workflow_type="course",
    )


@pytest.mark.django_db
def test_user_manager_assigns_one_default_account_role_and_can_replace_it():
    User = get_user_model()
    user = User.objects.create_user(email="role@example.com", password="password123")

    assert user.account_role is AccountRole.STUDENT
    assert list(user.groups.values_list("name", flat=True)) == ["student"]

    user.set_account_role(AccountRole.TEACHER)

    assert user.account_role is AccountRole.TEACHER
    assert list(user.groups.values_list("name", flat=True)) == ["teacher"]


@pytest.mark.django_db
def test_multiple_canonical_account_roles_fail_closed(authorization, project, users):
    users["owner"].groups.add(Group.objects.get(name=AccountRole.TEACHER.value))

    context = authorization.permissions_for_project(
        user=users["owner"],
        project=project,
    )

    assert context.account_role is None
    assert context.actions == frozenset()


@pytest.mark.django_db
def test_team_role_database_constraint_rejects_unknown_roles(project, users):
    with pytest.raises(IntegrityError), transaction.atomic():
        TeamUser.objects.create(
            team=project.team,
            user=users["public"],
            role="owner",
        )


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("user_name", "role", "allowed", "denied"),
    [
        (
            "owner",
            ResourceRole.OWNER,
            ProjectPermission.ARCHIVE_PROJECT,
            ProjectPermission.RESTORE_PROJECT,
        ),
        (
            "editor",
            ResourceRole.EDITOR,
            ProjectPermission.MANAGE_MEMBERS,
            ProjectPermission.ARCHIVE_PROJECT,
        ),
        (
            "commenter",
            ResourceRole.COMMENTER,
            ProjectPermission.VIEW,
            ProjectPermission.EDIT_PROJECT,
        ),
        (
            "viewer",
            ResourceRole.VIEWER,
            ProjectPermission.VIEW,
            ProjectPermission.MANAGE_MEMBERS,
        ),
    ],
)
def test_private_project_role_matrix(
    authorization,
    project,
    users,
    user_name,
    role,
    allowed,
    denied,
):
    context = authorization.permissions_for_project(
        user=users[user_name],
        project=project,
    )

    assert context.resource_role is role
    assert context.allows(allowed)
    assert not context.allows(denied)


@pytest.mark.django_db
def test_public_non_contributor_can_only_view_project_and_workflow(
    authorization,
    project,
    workflow,
    users,
):
    project.is_published = True
    project.save(update_fields=["is_published"])

    project_context = authorization.permissions_for_project(
        user=users["public"],
        project=project,
    )
    workflow_context = authorization.permissions_for_workflow(
        user=users["public"],
        workflow=workflow,
    )

    assert project_context.resource_role is ResourceRole.PUBLIC
    assert project_context.actions == frozenset({ProjectPermission.VIEW.value})
    assert workflow_context.resource_role is ResourceRole.PUBLIC
    assert workflow_context.actions == frozenset({WorkflowPermission.VIEW.value})


@pytest.mark.django_db
def test_workflow_owner_resolution_precedes_project_team_role(
    authorization,
    project,
    workflow,
    users,
):
    TeamUser.objects.create(
        team=project.team,
        user=users["author"],
        role=TeamRole.VIEWER,
    )

    author_context = authorization.permissions_for_workflow(
        user=users["author"],
        workflow=workflow,
    )
    project_owner_context = authorization.permissions_for_workflow(
        user=users["owner"],
        workflow=workflow,
    )

    assert author_context.resource_role is ResourceRole.OWNER
    assert author_context.allows(WorkflowPermission.ARCHIVE)
    assert project_owner_context.resource_role is ResourceRole.OWNER
    assert project_owner_context.allows(WorkflowPermission.ARCHIVE)


@pytest.mark.django_db
def test_workflow_contributor_permissions(authorization, workflow, users):
    editor = authorization.permissions_for_workflow(
        user=users["editor"],
        workflow=workflow,
    )
    commenter = authorization.permissions_for_workflow(
        user=users["commenter"],
        workflow=workflow,
    )
    viewer = authorization.permissions_for_workflow(
        user=users["viewer"],
        workflow=workflow,
    )

    assert editor.allows(WorkflowPermission.NODE_MANAGEMENT)
    assert not editor.allows(WorkflowPermission.ARCHIVE)
    assert commenter.allows(WorkflowPermission.COMMENT)
    assert commenter.allows(WorkflowPermission.DELETE_OWN_COMMENT)
    assert viewer.allows(WorkflowPermission.VIEW)
    assert not viewer.allows(WorkflowPermission.COMMENT)


@pytest.mark.django_db
def test_archived_resources_are_not_viewable_but_owner_can_restore_and_delete(
    authorization,
    project,
    workflow,
    users,
):
    project.is_archived = True
    project.save(update_fields=["is_archived"])

    project_context = authorization.permissions_for_project(
        user=users["owner"],
        project=project,
    )
    workflow_context = authorization.permissions_for_workflow(
        user=users["owner"],
        workflow=workflow,
    )

    assert not project_context.allows(ProjectPermission.VIEW)
    assert project_context.allows(ProjectPermission.RESTORE_PROJECT)
    assert project_context.allows(ProjectPermission.DELETE_PROJECT)
    assert not workflow_context.allows(WorkflowPermission.VIEW)
    assert workflow_context.allows(WorkflowPermission.RESTORE)
    assert workflow_context.allows(WorkflowPermission.DELETE_PERMANENTLY)


@pytest.mark.django_db
def test_admin_group_explicitly_bypasses_resource_matrix(
    authorization,
    project,
    workflow,
    users,
):
    users["public"].set_account_role(AccountRole.ADMIN)
    project.is_archived = True
    project.save(update_fields=["is_archived"])

    project_context = authorization.permissions_for_project(
        user=users["public"],
        project=project,
    )
    workflow_context = authorization.permissions_for_workflow(
        user=users["public"],
        workflow=workflow,
    )

    assert project_context.admin_override
    assert project_context.actions == frozenset(
        permission.value for permission in ProjectPermission
    )
    assert workflow_context.admin_override
    assert workflow_context.actions == frozenset(
        permission.value for permission in WorkflowPermission
    )
