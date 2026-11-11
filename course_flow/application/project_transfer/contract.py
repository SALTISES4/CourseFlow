"""
Versioned, persistence-independent contract for CourseFlow project transfer.

The contract deliberately uses opaque string references instead of Django primary
keys. A v2-to-v2 export can use UUID strings, while a future v1 adapter can use
stable legacy identifiers and feed the same validator and destination writer.
"""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Hashable, Iterable
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, model_validator

SNAPSHOT_KIND = "courseflow.project"
SNAPSHOT_SCHEMA_VERSION = 1

Reference = Annotated[str, Field(min_length=1, max_length=255)]
Sha256 = Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]
ShortText = Annotated[str, Field(max_length=200)]
PositiveSmallInteger = Annotated[int, Field(ge=0, le=32767)]
NonNegativeInteger = Annotated[int, Field(ge=0)]
StoredDecimal = Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
OptionalStoredDecimal = StoredDecimal | None
UniqueValue = TypeVar("UniqueValue", bound=Hashable)


class ProjectSnapshotContractError(ValueError):
    """Raised when a snapshot violates aggregate-level transfer invariants."""


class SnapshotModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class ExclusionSnapshot(SnapshotModel):
    kind: Annotated[str, Field(min_length=1, max_length=64)]
    count: NonNegativeInteger
    reason: Annotated[str, Field(min_length=1, max_length=500)]


class SourceSnapshot(SnapshotModel):
    system: Annotated[str, Field(min_length=1, max_length=100)]
    project_id: Reference
    exported_at: datetime
    fingerprint_sha256: Sha256
    exclusions: tuple[ExclusionSnapshot, ...] = ()

    @model_validator(mode="after")
    def require_timezone_and_unique_exclusions(self) -> SourceSnapshot:
        if self.exported_at.tzinfo is None or self.exported_at.utcoffset() is None:
            raise ValueError("source.exported_at must include a timezone")
        _require_unique(
            (entry.kind for entry in self.exclusions),
            scope="source.exclusions",
        )
        return self


class TagSnapshot(SnapshotModel):
    ref: Reference
    label: Annotated[str, Field(max_length=255)]
    translation_plural: Annotated[str, Field(max_length=255)] = ""


class ActivityMetaSnapshot(SnapshotModel):
    kind: Literal["activity"] = "activity"
    calculate_time: bool = False
    context_classification: Annotated[str | None, Field(max_length=64)] = None
    task_classification: Annotated[str | None, Field(max_length=64)] = None
    time_required: OptionalStoredDecimal = None
    time_units: Annotated[str | None, Field(max_length=16)] = None
    represents_workflow: bool = False
    context: Annotated[str, Field(max_length=1024)] = ""
    classification: Annotated[str, Field(max_length=255)] = ""


class CourseMetaSnapshot(SnapshotModel):
    kind: Literal["course"] = "course"
    calculate_time: bool = False
    time_required: OptionalStoredDecimal = None
    time_units: Annotated[str | None, Field(max_length=16)] = None
    ponderation_theory: OptionalStoredDecimal = None
    ponderation_practice: OptionalStoredDecimal = None
    ponderation_individual: OptionalStoredDecimal = None
    credits: Annotated[int | None, Field(ge=0)] = None
    specific_education: bool = False
    classification: Annotated[str, Field(max_length=255)] = ""
    code: Annotated[str, Field(max_length=255)] = ""


class ProgramMetaSnapshot(SnapshotModel):
    kind: Literal["program"] = "program"
    code: Annotated[str, Field(max_length=255)] = ""
    calculate_time: str = ""
    calculate_credits: str = ""
    calculate_ponderation: str = ""
    calculate_classification: str = ""
    time_required: OptionalStoredDecimal = None
    time_units: Annotated[str | None, Field(max_length=16)] = None
    ponderation_theory: OptionalStoredDecimal = None
    ponderation_practice: OptionalStoredDecimal = None
    ponderation_individual: OptionalStoredDecimal = None
    credits: Annotated[int | None, Field(ge=0)] = None
    classification_general_seconds: Decimal | None = None
    classification_specific_seconds: Decimal | None = None


class TaskMetaSnapshot(SnapshotModel):
    kind: Literal["task"] = "task"
    context_classification: Annotated[str | None, Field(max_length=64)] = None
    task_classification: Annotated[str | None, Field(max_length=64)] = None
    time_required: OptionalStoredDecimal = None
    time_units: Annotated[str | None, Field(max_length=16)] = None
    represents_workflow: bool = False
    context: Annotated[str, Field(max_length=1024)] = ""


WorkflowMetaSnapshot = Annotated[
    ActivityMetaSnapshot | CourseMetaSnapshot | ProgramMetaSnapshot,
    Field(discriminator="kind"),
]
NodeMetaSnapshot = Annotated[
    ActivityMetaSnapshot | CourseMetaSnapshot | TaskMetaSnapshot,
    Field(discriminator="kind"),
]


class SectionSnapshot(SnapshotModel):
    ref: Reference
    title: ShortText
    title_copy_count: PositiveSmallInteger = 0
    position: int


class ChannelSnapshot(SnapshotModel):
    ref: Reference
    title: ShortText
    system_label_code: Annotated[str | None, Field(max_length=64)] = None
    title_copy_count: PositiveSmallInteger = 0
    colour: Annotated[str, Field(max_length=7)] = ""
    position: int

    @model_validator(mode="after")
    def validate_colour(self) -> ChannelSnapshot:
        if self.colour and not re.fullmatch(r"#[0-9A-Fa-f]{6}", self.colour):
            raise ValueError("channel colour must be empty or #RRGGBB")
        return self


class OutcomeSnapshot(SnapshotModel):
    ref: Reference
    parent_ref: Reference | None = None
    order: NonNegativeInteger
    title: ShortText
    title_copy_count: PositiveSmallInteger = 0
    description: str = ""
    code: Annotated[str, Field(max_length=64)] = ""
    tag_refs: tuple[Reference, ...] = ()


class NodeSnapshot(SnapshotModel):
    ref: Reference
    section_ref: Reference
    channel_ref: Reference
    linked_workflow_ref: Reference | None = None
    section_row: NonNegativeInteger
    node_type: Literal["course", "activity", "task"]
    title: ShortText
    title_copy_count: PositiveSmallInteger = 0
    description: str = ""
    metadata: NodeMetaSnapshot
    tag_refs: tuple[Reference, ...] = ()
    outcome_refs: tuple[Reference, ...] = ()


class EdgeSnapshot(SnapshotModel):
    ref: Reference
    source_node_ref: Reference
    target_node_ref: Reference
    title: Annotated[str, Field(max_length=255)] = ""
    text_position: PositiveSmallInteger = 50
    line_type: Annotated[str, Field(max_length=64)] = ""
    source_port: Annotated[str, Field(min_length=1, max_length=64)]
    target_port: Annotated[str, Field(min_length=1, max_length=64)]


class HorizontalOutcomeSnapshot(SnapshotModel):
    ref: Reference
    outcome_refs: tuple[Reference, ...]


class GraphSnapshot(SnapshotModel):
    ref: Reference
    revision_id: NonNegativeInteger = 0
    sections: tuple[SectionSnapshot, ...]
    channels: tuple[ChannelSnapshot, ...]
    outcomes: tuple[OutcomeSnapshot, ...] = ()
    nodes: tuple[NodeSnapshot, ...] = ()
    edges: tuple[EdgeSnapshot, ...] = ()
    horizontal_outcomes: tuple[HorizontalOutcomeSnapshot, ...] = ()


class WorkflowSnapshot(SnapshotModel):
    ref: Reference
    title: ShortText
    description: str = ""
    is_archived: bool = False
    public_link_enabled: bool = False
    workflow_type: Literal["program", "course", "activity"]
    metadata: WorkflowMetaSnapshot
    graph: GraphSnapshot


class ProjectSnapshot(SnapshotModel):
    ref: Reference
    title: Annotated[str, Field(min_length=1, max_length=200)]
    description: str = ""
    is_published: bool = False
    is_archived: bool = False
    is_template: bool = False
    discipline_codes: tuple[Annotated[str, Field(min_length=1, max_length=64)], ...]
    tags: tuple[TagSnapshot, ...] = ()
    workflows: tuple[WorkflowSnapshot, ...] = ()


class ProjectSnapshotBundle(SnapshotModel):
    kind: Literal["courseflow.project"] = SNAPSHOT_KIND
    schema_version: Literal[1] = SNAPSHOT_SCHEMA_VERSION
    source: SourceSnapshot
    project: ProjectSnapshot

    @classmethod
    def build(
        cls,
        *,
        source_system: str,
        exported_at: datetime,
        exclusions: tuple[ExclusionSnapshot, ...],
        project: ProjectSnapshot,
    ) -> ProjectSnapshotBundle:
        source = SourceSnapshot(
            system=source_system,
            project_id=project.ref,
            exported_at=exported_at,
            fingerprint_sha256=fingerprint_project(project),
            exclusions=exclusions,
        )
        return cls(source=source, project=project)

    @model_validator(mode="after")
    def validate_aggregate(self) -> ProjectSnapshotBundle:
        if self.source.project_id != self.project.ref:
            raise ValueError("source.project_id must match project.ref")
        actual_fingerprint = fingerprint_project(self.project)
        if self.source.fingerprint_sha256 != actual_fingerprint:
            raise ValueError(
                "source.fingerprint_sha256 does not match the project payload"
            )
        try:
            _validate_project(self.project)
        except ProjectSnapshotContractError as exc:
            raise ValueError(str(exc)) from exc
        return self


def fingerprint_project(project: ProjectSnapshot) -> str:
    """Return a deterministic fingerprint of content-bearing project data."""
    payload = json.dumps(
        project.model_dump(mode="json"),
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _require_unique(
    values: Iterable[UniqueValue],
    *,
    scope: str,
) -> set[UniqueValue]:
    seen: set[UniqueValue] = set()
    duplicates: set[UniqueValue] = set()
    for value in values:
        if value in seen:
            duplicates.add(str(value))
        seen.add(value)
    if duplicates:
        rendered = ", ".join(sorted(str(value) for value in duplicates))
        raise ProjectSnapshotContractError(f"duplicate values in {scope}: {rendered}")
    return seen


def _validate_project(project: ProjectSnapshot) -> None:
    _require_unique(project.discipline_codes, scope="project.discipline_codes")
    tag_refs = _require_unique((tag.ref for tag in project.tags), scope="project.tags")
    workflow_refs = _require_unique(
        (workflow.ref for workflow in project.workflows),
        scope="project.workflows",
    )
    _require_unique(
        (workflow.graph.ref for workflow in project.workflows),
        scope="project.workflow.graphs",
    )

    expected_node_type = {
        "program": "course",
        "course": "activity",
        "activity": "task",
    }

    for workflow in project.workflows:
        if workflow.metadata.kind != workflow.workflow_type:
            raise ProjectSnapshotContractError(
                f"workflow {workflow.ref!r} metadata kind does not match "
                f"workflow_type {workflow.workflow_type!r}"
            )
        graph = workflow.graph
        section_refs = _require_unique(
            (section.ref for section in graph.sections),
            scope=f"workflow {workflow.ref} sections",
        )
        channel_refs = _require_unique(
            (channel.ref for channel in graph.channels),
            scope=f"workflow {workflow.ref} channels",
        )
        _require_unique(
            (section.position for section in graph.sections),
            scope=f"workflow {workflow.ref} section positions",
        )
        _require_unique(
            (channel.position for channel in graph.channels),
            scope=f"workflow {workflow.ref} channel positions",
        )
        outcome_refs = _require_unique(
            (outcome.ref for outcome in graph.outcomes),
            scope=f"workflow {workflow.ref} outcomes",
        )
        node_refs = _require_unique(
            (node.ref for node in graph.nodes),
            scope=f"workflow {workflow.ref} nodes",
        )
        _require_unique(
            (edge.ref for edge in graph.edges),
            scope=f"workflow {workflow.ref} edges",
        )
        _require_unique(
            (group.ref for group in graph.horizontal_outcomes),
            scope=f"workflow {workflow.ref} horizontal outcomes",
        )

        placements: list[str] = []
        for node in graph.nodes:
            if node.section_ref not in section_refs:
                raise ProjectSnapshotContractError(
                    f"node {node.ref!r} references unknown section {node.section_ref!r}"
                )
            if node.channel_ref not in channel_refs:
                raise ProjectSnapshotContractError(
                    f"node {node.ref!r} references unknown channel {node.channel_ref!r}"
                )
            if node.linked_workflow_ref not in (None, *workflow_refs):
                raise ProjectSnapshotContractError(
                    f"node {node.ref!r} links outside the project snapshot"
                )
            if node.node_type != expected_node_type[workflow.workflow_type]:
                raise ProjectSnapshotContractError(
                    f"node {node.ref!r} type {node.node_type!r} is invalid for "
                    f"{workflow.workflow_type!r} workflow {workflow.ref!r}"
                )
            if node.metadata.kind != node.node_type:
                raise ProjectSnapshotContractError(
                    f"node {node.ref!r} metadata kind does not match node_type"
                )
            unknown_tags = set(node.tag_refs) - tag_refs
            if unknown_tags:
                raise ProjectSnapshotContractError(
                    f"node {node.ref!r} references unknown tags: "
                    f"{', '.join(sorted(unknown_tags))}"
                )
            unknown_outcomes = set(node.outcome_refs) - outcome_refs
            if unknown_outcomes:
                raise ProjectSnapshotContractError(
                    f"node {node.ref!r} references unknown outcomes: "
                    f"{', '.join(sorted(unknown_outcomes))}"
                )
            _require_unique(node.tag_refs, scope=f"node {node.ref} tag_refs")
            _require_unique(node.outcome_refs, scope=f"node {node.ref} outcome_refs")
            placements.append(
                f"{node.section_ref}\0{node.channel_ref}\0{node.section_row}"
            )
        _require_unique(placements, scope=f"workflow {workflow.ref} node placements")

        outcomes_by_ref = {outcome.ref: outcome for outcome in graph.outcomes}
        sibling_positions: list[str] = []
        for outcome in graph.outcomes:
            if outcome.parent_ref is not None and outcome.parent_ref not in outcome_refs:
                raise ProjectSnapshotContractError(
                    f"outcome {outcome.ref!r} references unknown parent"
                )
            if outcome.parent_ref == outcome.ref:
                raise ProjectSnapshotContractError(
                    f"outcome {outcome.ref!r} cannot be its own parent"
                )
            unknown_tags = set(outcome.tag_refs) - tag_refs
            if unknown_tags:
                raise ProjectSnapshotContractError(
                    f"outcome {outcome.ref!r} references unknown tags: "
                    f"{', '.join(sorted(unknown_tags))}"
                )
            _require_unique(outcome.tag_refs, scope=f"outcome {outcome.ref} tag_refs")
            sibling_positions.append(f"{outcome.parent_ref or ''}\0{outcome.order}")
        _require_unique(
            sibling_positions,
            scope=f"workflow {workflow.ref} outcome sibling positions",
        )
        _require_acyclic_outcomes(outcomes_by_ref, workflow_ref=workflow.ref)

        for edge in graph.edges:
            if edge.source_node_ref not in node_refs or edge.target_node_ref not in node_refs:
                raise ProjectSnapshotContractError(
                    f"edge {edge.ref!r} references a node outside workflow {workflow.ref!r}"
                )

        for group in graph.horizontal_outcomes:
            _require_unique(
                group.outcome_refs,
                scope=f"horizontal outcome {group.ref} outcome_refs",
            )
            unknown_outcomes = set(group.outcome_refs) - outcome_refs
            if unknown_outcomes:
                raise ProjectSnapshotContractError(
                    f"horizontal outcome {group.ref!r} crosses a workflow boundary"
                )


def _require_acyclic_outcomes(
    outcomes_by_ref: dict[str, OutcomeSnapshot],
    *,
    workflow_ref: str,
) -> None:
    complete: set[str] = set()
    for start_ref in outcomes_by_ref:
        path: set[str] = set()
        current_ref: str | None = start_ref
        while current_ref is not None and current_ref not in complete:
            if current_ref in path:
                raise ProjectSnapshotContractError(
                    f"outcome cycle detected in workflow {workflow_ref!r}"
                )
            path.add(current_ref)
            current_ref = outcomes_by_ref[current_ref].parent_ref
        complete.update(path)
