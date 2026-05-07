"""Regression tests for Part A delete semantics (model + signals)."""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from course_flow.core.enum import WorkflowType
from course_flow.core.models import (
    Activitymeta,
    Authtoken,
    Channel,
    Comment,
    Discipline,
    Edge,
    Graph,
    Node,
    Notification,
    Project,
    Section,
    Tag,
    Team,
    Thread,
    Workflow,
)
from course_flow.core.models.relations import (
    FavoriteProject,
    ProjectDiscipline,
)


@pytest.fixture
def user_a():
    return get_user_model().objects.create_user(email="cascade-a@example.com", password="x")


@pytest.fixture
def user_b():
    return get_user_model().objects.create_user(email="cascade-b@example.com", password="x")


def _graph_with_workflow(owner, *, project=None):
    g = Graph.objects.create()
    Workflow.objects.create(
        graph=g,
        author=owner,
        project=project,
        title="W",
        description="",
        workflow_type=WorkflowType.COURSE,
    )
    return g


@pytest.mark.django_db
def test_project_delete_cascades_graph_team_favorites_not_discipline_or_tag_rows(
    user_a,
):
    p = Project.objects.create(owner=user_a, title="P")
    d = Discipline.objects.create(label="D")
    ProjectDiscipline.objects.create(project=p, discipline=d)
    tag = Tag.objects.create(project=p, label="T")
    wf = _graph_with_workflow(user_a, project=p)
    FavoriteProject.objects.create(user=user_a, project=p)
    Team.objects.get_or_create(project=p)

    pid, did, tag_id, wf_id = p.id, d.id, tag.id, wf.id
    p.delete()

    assert not Project.objects.filter(pk=pid).exists()
    assert not Graph.objects.filter(pk=wf_id).exists()
    assert not FavoriteProject.objects.filter(project_id=pid).exists()
    assert not Team.objects.filter(project_id=pid).exists()
    assert not ProjectDiscipline.objects.filter(project_id=pid).exists()
    assert Discipline.objects.filter(pk=did).exists()
    tag.refresh_from_db()
    assert tag.project_id is None


@pytest.mark.django_db
def test_user_delete_cascades_owned_projects_graphs_notifications_favorites_comments_tokens(
    user_a,
):
    p = Project.objects.create(owner=user_a, title="P")
    wf = _graph_with_workflow(user_a, project=p)
    Notification.objects.create(user=user_a, message="hi")
    FavoriteProject.objects.create(user=user_a, project=p)
    thread = Thread.objects.create()
    Comment.objects.create(thread=thread, author=user_a, body="c")
    Authtoken.objects.create(
        user=user_a,
        token_hash="b" * 64,
        expires_at=timezone.now() + timedelta(days=1),
    )

    uid = user_a.id
    user_a.delete()

    assert not get_user_model().objects.filter(pk=uid).exists()
    assert not Project.objects.filter(owner_id=uid).exists()
    assert not Workflow.objects.filter(author_id=uid).exists()
    assert not Graph.objects.filter(pk=wf.id).exists()
    assert not Notification.objects.filter(user_id=uid).exists()
    assert not FavoriteProject.objects.filter(user_id=uid).exists()
    assert not Comment.objects.filter(author_id=uid).exists()
    assert not Authtoken.objects.filter(user_id=uid).exists()


@pytest.mark.django_db
def test_channel_delete_cascades_nodes_and_linked_thread(user_a):
    g = _graph_with_workflow(user_a)
    th_ch = Thread.objects.create()
    th_node = Thread.objects.create()
    ch = Channel.objects.create(graph=g, title="C", position=0, thread=th_ch)
    sec = Section.objects.create(graph=g, title="S", position=0)
    node = Node.objects.create(
        channel=ch,
        section=sec,
        workflow=g.workflow,
        thread=th_node,
        section_row=0,
    )

    nid, tid = node.id, th_ch.id
    ch.delete()

    assert not Node.objects.filter(pk=nid).exists()
    assert not Thread.objects.filter(pk=tid).exists()


@pytest.mark.django_db
def test_section_delete_cascades_nodes_and_linked_thread(user_a):
    g = _graph_with_workflow(user_a)
    th_sec = Thread.objects.create()
    th_node = Thread.objects.create()
    sec = Section.objects.create(graph=g, title="S", position=0, thread=th_sec)
    ch = Channel.objects.create(graph=g, title="C", position=0)
    node = Node.objects.create(
        section=sec,
        channel=ch,
        workflow=g.workflow,
        thread=th_node,
        section_row=0,
    )

    nid, tid = node.id, th_sec.id
    sec.delete()

    assert not Node.objects.filter(pk=nid).exists()
    assert not Thread.objects.filter(pk=tid).exists()


@pytest.mark.django_db
def test_graph_delete_cascades_workflow(user_a):
    wf = _graph_with_workflow(user_a)
    uid = wf.workflow.id
    wid = wf.id
    wf.delete()
    assert not Graph.objects.filter(pk=wid).exists()
    assert not Workflow.objects.filter(pk=uid).exists()


@pytest.mark.django_db
def test_workflow_delete_cascades_nodes_and_activity_meta(user_a):
    g = _graph_with_workflow(user_a)
    workflow = g.workflow
    sec = Section.objects.create(graph=g, title="S", position=0)
    ch = Channel.objects.create(graph=g, title="C", position=0)
    th = Thread.objects.create()
    node = Node.objects.create(
        workflow=workflow,
        section=sec,
        channel=ch,
        thread=th,
        section_row=0,
    )
    Activitymeta.objects.create(workflow=workflow)
    nid, workflow_pk = node.id, workflow.pk
    workflow.delete()
    assert not Node.objects.filter(pk=nid).exists()
    assert not Activitymeta.objects.filter(workflow_id=workflow_pk).exists()


@pytest.mark.django_db
def test_thread_delete_cascades_comments(user_a):
    thread = Thread.objects.create()
    c = Comment.objects.create(thread=thread, author=user_a, body="x")
    cid = c.id
    thread.delete()
    assert not Comment.objects.filter(pk=cid).exists()


@pytest.mark.django_db
def test_node_delete_cascades_edges_and_thread(user_a):
    g = _graph_with_workflow(user_a)
    sec = Section.objects.create(graph=g, title="S", position=0)
    ch = Channel.objects.create(graph=g, title="C", position=0)
    th1 = Thread.objects.create()
    th2 = Thread.objects.create()
    n1 = Node.objects.create(
        section=sec, channel=ch, workflow=g.workflow, thread=th1, section_row=0
    )
    n2 = Node.objects.create(
        section=sec, channel=ch, workflow=g.workflow, thread=th2, section_row=1
    )
    Edge.objects.create(source_node=n1, target_node=n2)

    eid, tid, n1_id = (
        Edge.objects.get(source_node=n1).id,
        th1.id,
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
