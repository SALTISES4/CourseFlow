from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from course_flow.application.project_transfer.contract import (
    ProjectSnapshotBundle,
)
from course_flow.application.project_transfer.service import (
    ProjectImportService,
)
from course_flow.core.enum import AccountRole, NodeType, WorkflowType
from course_flow.core.models import (
    Channel,
    Discipline,
    Edge,
    Graph,
    Horizontaloutcome,
    Node,
    Outcome,
    Project,
    Section,
    Tag,
    User,
    Workflow,
)
from course_flow.infrastructure.project_transfer import (
    DjangoProjectSnapshotExporter,
    DjangoProjectSnapshotWriter,
    ProjectSnapshotImportConflict,
)

_REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
_SNAPSHOT_PATH = (
    _REPOSITORY_ROOT
    / "course_flow"
    / "project_snapshots"
    / "project_for_templates.v1.json"
)
_SCHEMA_PATH = _REPOSITORY_ROOT / "docs" / "schemas" / "project_snapshot_v1.schema.json"


def _load_snapshot() -> ProjectSnapshotBundle:
    return ProjectSnapshotBundle.model_validate_json(
        _SNAPSHOT_PATH.read_text(encoding="utf-8")
    )


def _first_difference(actual, expected, path="project") -> str | None:
    if type(actual) is not type(expected):
        return f"{path}: type {type(actual).__name__} != {type(expected).__name__}"
    if isinstance(actual, dict):
        if actual.keys() != expected.keys():
            return f"{path}: keys {actual.keys()} != {expected.keys()}"
        for key in actual:
            difference = _first_difference(actual[key], expected[key], f"{path}.{key}")
            if difference is not None:
                return difference
        return None
    if isinstance(actual, list):
        if len(actual) != len(expected):
            return f"{path}: length {len(actual)} != {len(expected)}"
        for index, (actual_item, expected_item) in enumerate(zip(actual, expected)):
            difference = _first_difference(
                actual_item,
                expected_item,
                f"{path}[{index}]",
            )
            if difference is not None:
                return difference
        return None
    if actual != expected:
        return f"{path}: {actual!r} != {expected!r}"
    return None


def test_checked_in_project_snapshot_is_valid_and_complete():
    snapshot = _load_snapshot()

    assert snapshot.project.ref == "193cfbb1-3abc-42f2-a80c-a5c068a80460"
    assert snapshot.project.title == "Project for templates"
    assert snapshot.project.is_template is False
    assert len(snapshot.project.workflows) == 7
    assert sum(len(workflow.graph.nodes) for workflow in snapshot.project.workflows) == 190
    assert (
        sum(len(workflow.graph.outcomes) for workflow in snapshot.project.workflows)
        == 79
    )
    assert snapshot.source.fingerprint_sha256 == (
        "a74f3fc11af7f2863a3303b05348129d19807c2af3f300e4a1b3e923ee7a6be0"
    )
    assert {entry.kind: entry.count for entry in snapshot.source.exclusions} == {
        "comments": 0,
        "team_members": 0,
        "favourites": 0,
        "workspace_edit_locks": 8,
    }


def test_checked_in_json_schema_matches_canonical_contract():
    assert json.loads(_SCHEMA_PATH.read_text(encoding="utf-8")) == (
        ProjectSnapshotBundle.model_json_schema()
    )


def test_snapshot_fingerprint_rejects_content_tampering():
    payload = json.loads(_SNAPSHOT_PATH.read_text(encoding="utf-8"))
    payload["project"]["title"] = "Tampered title"

    with pytest.raises(ValidationError, match="fingerprint_sha256"):
        ProjectSnapshotBundle.model_validate(payload)


@pytest.mark.django_db
def test_checked_in_snapshot_round_trips_through_transactional_writer():
    snapshot = _load_snapshot()
    owner = User.objects.create_user(
        email="snapshot-owner@example.com",
        password="password",
        account_role=AccountRole.TEACHER,
    )
    Discipline.objects.get_or_create(code="science_general")
    service = ProjectImportService(DjangoProjectSnapshotWriter())

    result = service.import_project(
        snapshot=snapshot,
        owner_id=owner.id,
        identity_policy="preserve",
    )

    project = Project.objects.get(uuid=result.project_uuid)
    assert project.owner == owner
    assert project.title == snapshot.project.title
    assert project.is_template is False
    assert project.workflows.count() == 7
    assert result.node_count == 190
    assert result.outcome_count == 79
    reexported = DjangoProjectSnapshotExporter().export(
        project_uuid=project.uuid,
        source_system="round-trip-test",
    )
    actual = reexported.project.model_dump(mode="json")
    expected = snapshot.project.model_dump(mode="json")
    assert actual == expected, _first_difference(actual, expected)
    assert reexported.source.fingerprint_sha256 == snapshot.source.fingerprint_sha256

    with pytest.raises(ProjectSnapshotImportConflict):
        service.import_project(
            snapshot=snapshot,
            owner_id=owner.id,
            identity_policy="preserve",
        )
    assert Project.objects.filter(uuid=result.project_uuid).count() == 1


@pytest.mark.django_db
def test_regenerated_import_remaps_project_scoped_relationships():
    owner = User.objects.create_user(
        email="relationship-owner@example.com",
        password="password",
        account_role=AccountRole.TEACHER,
    )
    discipline, _ = Discipline.objects.get_or_create(code="science_general")
    source = Project.objects.create(owner=owner, title="Relationship source")
    source.disciplines.add(discipline)
    tag = Tag.objects.create(project=source, label="Assessment")

    linked_graph = Graph.objects.create()
    linked_workflow = Workflow.objects.create(
        graph=linked_graph,
        author=owner,
        project=source,
        title="Linked activity",
        workflow_type=WorkflowType.ACTIVITY,
    )
    Section.objects.create(graph=linked_graph, title="Linked section", position=0)
    Channel.objects.create(
        graph=linked_graph,
        title="Linked channel",
        colour="#112233",
        position=0,
    )

    main_graph = Graph.objects.create()
    main_workflow = Workflow.objects.create(
        graph=main_graph,
        author=owner,
        project=source,
        title="Main course",
        workflow_type=WorkflowType.COURSE,
    )
    section = Section.objects.create(graph=main_graph, title="Week 1", position=0)
    channel = Channel.objects.create(
        graph=main_graph,
        title="Students",
        colour="#445566",
        position=0,
    )
    first = Node.objects.create(
        section=section,
        channel=channel,
        workflow=main_workflow,
        linked_workflow=linked_workflow,
        section_row=0,
        node_type=NodeType.ACTIVITY,
        title="Linked node",
    )
    second = Node.objects.create(
        section=section,
        channel=channel,
        workflow=main_workflow,
        section_row=1,
        node_type=NodeType.ACTIVITY,
        title="Second node",
    )
    first.tags.add(tag)
    root = Outcome.objects.create(graph=main_graph, order=0, title="Root")
    child = Outcome.objects.create(
        graph=main_graph,
        parent=root,
        order=0,
        title="Child",
    )
    child.tags.add(tag)
    first.outcomes.add(child)
    Edge.objects.create(
        source_node=first,
        target_node=second,
        source_port="right",
        target_port="left",
    )
    horizontal = Horizontaloutcome.objects.create()
    horizontal.outcomes.add(root, child)

    snapshot = DjangoProjectSnapshotExporter().export(
        project_uuid=source.uuid,
        source_system="relationship-test",
    )
    result = ProjectImportService(DjangoProjectSnapshotWriter()).import_project(
        snapshot=snapshot,
        owner_id=owner.id,
        identity_policy="regenerate",
    )

    imported = Project.objects.get(uuid=result.project_uuid)
    assert imported.uuid != source.uuid
    imported_main = imported.workflows.get(title="Main course")
    imported_linked = imported.workflows.get(title="Linked activity")
    imported_first = imported_main.nodes.get(title="Linked node")
    imported_second = imported_main.nodes.get(title="Second node")
    assert imported_first.linked_workflow == imported_linked
    assert imported_first.linked_workflow != linked_workflow
    assert list(imported_first.tags.values_list("label", flat=True)) == ["Assessment"]
    imported_child = imported_main.graph.outcomes.get(title="Child")
    assert imported_child.parent.title == "Root"
    assert list(imported_child.tags.values_list("label", flat=True)) == ["Assessment"]
    assert list(imported_first.outcomes.values_list("title", flat=True)) == ["Child"]
    assert Edge.objects.filter(
        source_node=imported_first,
        target_node=imported_second,
    ).exists()
    assert Horizontaloutcome.objects.filter(
        outcomes__graph=imported_main.graph
    ).distinct().count() == 1
