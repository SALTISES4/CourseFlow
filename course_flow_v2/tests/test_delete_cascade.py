"""Regression tests for Part A delete semantics (model + signals)."""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model

from course_flow_v2.core.models import (
    ActivityMeta,
    AuthToken,
    Channel,
    Comment,
    Discipline,
    Edge,
    Node,
    Notification,
    Project,
    ProjectTeam,
    Section,
    Tag,
    Thread,
    Unit,
    Workflow,
)
from course_flow_v2.core.models.rel import FavoriteProject, ProjectDiscipline


@pytest.fixture
def user_a():
    return get_user_model().objects.create_user(email="cascade-a@example.com", password="x")


@pytest.fixture
def user_b():
    return get_user_model().objects.create_user(email="cascade-b@example.com", password="x")


def _workflow_with_unit(owner, *, project=None):
    wf = Workflow.objects.create(owner=owner, title="W", project=project)
    Unit.objects.create(
        workflow=wf,
        title="",
        description="",
        unit_type=Unit.UnitType.COURSE,
    )
    return wf


@pytest.mark.django_db
def test_project_delete_cascades_workflow_team_favorites_not_discipline_or_tag_rows(
    user_a,
):
    p = Project.objects.create(owner=user_a, title="P")
    d = Discipline.objects.create(label="D")
    ProjectDiscipline.objects.create(project=p, discipline=d)
    tag = Tag.objects.create(project=p, label="T")
    wf = _workflow_with_unit(user_a, project=p)
    FavoriteProject.objects.create(user=user_a, project=p)
    ProjectTeam.objects.get_or_create(project=p)

    pid, did, tag_id, wf_id = p.id, d.id, tag.id, wf.id
    p.delete()

    assert not Project.objects.filter(pk=pid).exists()
    assert not Workflow.objects.filter(pk=wf_id).exists()
    assert not FavoriteProject.objects.filter(project_id=pid).exists()
    assert not ProjectTeam.objects.filter(project_id=pid).exists()
    assert not ProjectDiscipline.objects.filter(project_id=pid).exists()
    assert Discipline.objects.filter(pk=did).exists()
    tag.refresh_from_db()
    assert tag.project_id is None


@pytest.mark.django_db
def test_user_delete_cascades_owned_projects_workflows_notifications_favorites_comments_tokens(
    user_a,
):
    p = Project.objects.create(owner=user_a, title="P")
    wf = _workflow_with_unit(user_a, project=p)
    Notification.objects.create(user=user_a, message="hi")
    FavoriteProject.objects.create(user=user_a, project=p)
    thread = Thread.objects.create()
    Comment.objects.create(thread=thread, owner=user_a, body="c")
    from django.utils import timezone

    AuthToken.objects.create(
        user=user_a,
        token_hash="b" * 64,
        expires_at=timezone.now() + timedelta(days=1),
    )

    uid = user_a.id
    user_a.delete()

    assert not get_user_model().objects.filter(pk=uid).exists()
    assert not Project.objects.filter(owner_id=uid).exists()
    assert not Workflow.objects.filter(owner_id=uid).exists()
    assert not Notification.objects.filter(user_id=uid).exists()
    assert not FavoriteProject.objects.filter(user_id=uid).exists()
    assert not Comment.objects.filter(owner_id=uid).exists()
    assert not AuthToken.objects.filter(user_id=uid).exists()


@pytest.mark.django_db
def test_channel_delete_cascades_nodes_and_linked_thread(user_a):
    wf = _workflow_with_unit(user_a)
    thread = Thread.objects.create()
    ch = Channel.objects.create(workflow=wf, title="C", position=0, thread=thread)
    node = Node.objects.create(channel=ch, section=None)

    nid, tid = node.id, thread.id
    ch.delete()

    assert not Node.objects.filter(pk=nid).exists()
    assert not Thread.objects.filter(pk=tid).exists()


@pytest.mark.django_db
def test_section_delete_cascades_nodes_and_linked_thread(user_a):
    wf = _workflow_with_unit(user_a)
    thread = Thread.objects.create()
    sec = Section.objects.create(workflow=wf, title="S", position=0, thread=thread)
    node = Node.objects.create(section=sec, channel=None)

    nid, tid = node.id, thread.id
    sec.delete()

    assert not Node.objects.filter(pk=nid).exists()
    assert not Thread.objects.filter(pk=tid).exists()


@pytest.mark.django_db
def test_workflow_delete_cascades_unit(user_a):
    wf = _workflow_with_unit(user_a)
    uid = wf.unit.id
    wid = wf.id
    wf.delete()
    assert not Workflow.objects.filter(pk=wid).exists()
    assert not Unit.objects.filter(pk=uid).exists()


@pytest.mark.django_db
def test_unit_delete_cascades_nodes_and_activity_meta(user_a):
    wf = _workflow_with_unit(user_a)
    unit = wf.unit
    node = Node.objects.create(unit=unit, section=None, channel=None)
    ActivityMeta.objects.create(unit=unit)
    nid, unit_pk = node.id, unit.pk
    unit.delete()
    assert not Node.objects.filter(pk=nid).exists()
    assert not ActivityMeta.objects.filter(unit_id=unit_pk).exists()


@pytest.mark.django_db
def test_thread_delete_cascades_comments(user_a):
    thread = Thread.objects.create()
    c = Comment.objects.create(thread=thread, owner=user_a, body="x")
    cid = c.id
    thread.delete()
    assert not Comment.objects.filter(pk=cid).exists()


@pytest.mark.django_db
def test_node_delete_cascades_edges_and_thread(user_a):
    wf = _workflow_with_unit(user_a)
    sec = Section.objects.create(workflow=wf, title="S", position=0)
    ch = Channel.objects.create(workflow=wf, title="C", position=0)
    n1 = Node.objects.create(section=sec, channel=ch)
    n2 = Node.objects.create(section=sec, channel=ch)
    Edge.objects.create(source_node=n1, target_node=n2)
    th = Thread.objects.create()
    n1.thread = th
    n1.save()

    eid, tid, n1_id = (
        Edge.objects.get(source_node=n1).id,
        th.id,
        n1.id,
    )
    n1.delete()
    assert not Edge.objects.filter(pk=eid).exists()
    assert not Thread.objects.filter(pk=tid).exists()
    assert Node.objects.filter(pk=n2.id).exists()


@pytest.mark.django_db
def test_user_b_not_deleted_when_user_a_deleted(user_a, user_b):
    bid = user_b.id
    user_a.delete()
    assert get_user_model().objects.filter(pk=bid).exists()
