"""Tests for deterministic dev seed generation and clear behavior."""

from __future__ import annotations

import pytest
from django.contrib.auth import authenticate, get_user_model
from django.core.management import call_command
from django.db.models import Count

from course_flow.core.enum import WorkflowType
from course_flow.core.models import Edge, Node, Project
from course_flow.dev_seed.clear import clear_dev_seed_projects
from course_flow.dev_seed.constants import (
    DEV_SEED_ADMIN_EMAIL,
    DEV_SEED_PROJECT_TITLE_PREFIX,
    DEV_SEED_STUDENT_EMAIL,
    DEV_SEED_TEACHER_EMAIL,
)
from course_flow.dev_seed.orchestrator import (
    MANDATORY_WORKFLOW_TYPES,
    SeedConfig,
    generate_dev_seed,
)


@pytest.fixture(autouse=True)
def _clear_seed_before_each(django_db_blocker):
    with django_db_blocker.unblock():
        clear_dev_seed_projects(clear_all_projects=False)


@pytest.fixture(autouse=True)
def _admin_user_for_seed(django_db_blocker):
    """Admin is provisioned outside the seed command (like local dev setup)."""
    User = get_user_model()
    with django_db_blocker.unblock():
        User.objects.get_or_create(
            email=DEV_SEED_ADMIN_EMAIL,
            defaults={
                "first_name": "Admin",
                "last_name": "CourseFlow",
                "is_staff": True,
                "is_superuser": True,
            },
        )


@pytest.mark.django_db
def test_generate_twice_same_seed_same_title_and_counts():
    cfg = SeedConfig(seed=4242, graphs_per_project=3)
    clear_dev_seed_projects()
    r1 = generate_dev_seed(cfg)
    title1 = r1["projects"][0]["project_title"]
    node1 = r1["projects"][0]["graphs"][0]["node_count"]
    edge1 = r1["projects"][0]["graphs"][0]["edge_count"]

    clear_dev_seed_projects()
    r2 = generate_dev_seed(cfg)
    title2 = r2["projects"][0]["project_title"]
    node2 = r2["projects"][0]["graphs"][0]["node_count"]
    edge2 = r2["projects"][0]["graphs"][0]["edge_count"]

    assert title1 == title2
    assert title1.startswith(DEV_SEED_PROJECT_TITLE_PREFIX)
    assert node1 == node2
    assert edge1 == edge2


@pytest.mark.django_db
def test_seed_creates_three_projects_for_canonical_accounts():
    result = generate_dev_seed(SeedConfig(seed=99))
    assert len(result["projects"]) == 3
    emails = {p["owner_email"] for p in result["projects"]}
    assert emails == {
        DEV_SEED_ADMIN_EMAIL,
        DEV_SEED_TEACHER_EMAIL,
        DEV_SEED_STUDENT_EMAIL,
    }
    assert (
        Project.objects.filter(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX).count()
        == 3
    )


@pytest.mark.django_db
def test_teacher_and_student_can_authenticate_with_password():
    generate_dev_seed(SeedConfig(seed=1))
    assert authenticate(email=DEV_SEED_TEACHER_EMAIL, password="password") is not None
    assert authenticate(email=DEV_SEED_STUDENT_EMAIL, password="password") is not None


@pytest.mark.django_db
def test_each_seed_project_has_program_course_and_activity_workflows():
    generate_dev_seed(SeedConfig(seed=5, graphs_per_project=3))
    for email in (DEV_SEED_ADMIN_EMAIL, DEV_SEED_TEACHER_EMAIL, DEV_SEED_STUDENT_EMAIL):
        project = Project.objects.filter(
            title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX,
            owner__email=email,
        ).first()
        assert project is not None
        types = set(project.workflows.values_list("workflow_type", flat=True))
        assert types == {t.value for t in MANDATORY_WORKFLOW_TYPES}


@pytest.mark.django_db
def test_graphs_per_project_below_three_still_gets_mandatory_types():
    generate_dev_seed(SeedConfig(seed=6, graphs_per_project=1))
    project = Project.objects.filter(
        title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX,
    ).first()
    assert project is not None
    assert project.workflows.count() >= len(MANDATORY_WORKFLOW_TYPES)
    types = set(project.workflows.values_list("workflow_type", flat=True))
    assert WorkflowType.PROGRAM.value in types
    assert WorkflowType.COURSE.value in types
    assert WorkflowType.ACTIVITY.value in types


@pytest.mark.django_db
def test_bounded_shape_and_graph_parts():
    cfg = SeedConfig(
        seed=7,
        section_count=3,
        channel_count=3,
        tag_count=2,
    )
    generate_dev_seed(cfg)
    p = Project.objects.filter(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX).first()
    assert p is not None
    wf = p.workflows.select_related("graph").first()
    assert wf is not None
    g = wf.graph
    assert g is not None

    assert 1 <= g.sections.count() <= 5
    assert 2 <= g.channels.count() <= 5

    total_nodes = Node.objects.filter(section__graph=g).count()
    assert 4 * g.sections.count() <= total_nodes <= 12 * g.sections.count()

    for n in Node.objects.filter(section__graph=g):
        assert n.section_id is not None
        assert n.channel_id is not None
        assert n.section_row is not None

    edges = Edge.objects.filter(source_node__section__graph=g)
    assert edges.exists()
    for e in edges:
        assert e.source_node_id != e.target_node_id

    out_counts = (
        Edge.objects.filter(source_node__section__graph=g)
        .values("source_node_id")
        .annotate(c=Count("id"))
    )
    for row in out_counts:
        assert row["c"] <= 4


@pytest.mark.django_db
def test_same_section_edges_are_majority():
    cfg = SeedConfig(seed=11, section_count=4, channel_count=3)
    generate_dev_seed(cfg)
    p = Project.objects.filter(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX).first()
    assert p is not None
    wf = p.workflows.select_related("graph").first()
    g = wf.graph
    edges = Edge.objects.filter(
        source_node__section__graph=g,
        target_node__section__graph=g,
    )
    total = edges.count()
    same = sum(
        1
        for e in edges
        if e.source_node.section_id == e.target_node.section_id
    )
    assert total > 0
    assert same / total >= 0.65


@pytest.mark.django_db
def test_clear_removes_seed_project_tree():
    generate_dev_seed(SeedConfig(seed=3))
    assert Project.objects.filter(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX).exists()
    clear_dev_seed_projects()
    assert not Project.objects.filter(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX).exists()


@pytest.mark.django_db
def test_management_command_runs():
    call_command(
        "cf_seed_dev_data",
        "--seed",
        "100",
        "--section-count",
        "2",
        "--channel-count",
        "2",
    )
    assert (
        Project.objects.filter(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX).count()
        == 3
    )
