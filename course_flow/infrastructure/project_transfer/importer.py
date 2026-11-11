"""Transactional Django writer for validated project snapshots."""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from uuid import UUID, uuid4

from django.db import transaction

from course_flow.application.project_transfer.contract import (
    ProjectSnapshotBundle,
)
from course_flow.application.project_transfer.service import (
    IdentityPolicy,
    ProjectImportResult,
)
from course_flow.core.models import (
    Activitymeta,
    Channel,
    Coursemeta,
    Discipline,
    Edge,
    Graph,
    Horizontaloutcome,
    HorizontaloutcomeOutcome,
    Node,
    NodeOutcome,
    NodeTag,
    Outcome,
    OutcomeTag,
    Programmeta,
    Project,
    Section,
    Tag,
    Taskmeta,
    Workflow,
)


class ProjectSnapshotImportError(ValueError):
    """Raised when destination state cannot accept a valid snapshot."""


class ProjectSnapshotImportConflict(ProjectSnapshotImportError):
    """Raised when preserved snapshot identities already exist."""


class DjangoProjectSnapshotWriter:
    @transaction.atomic
    def write(
        self,
        *,
        snapshot: ProjectSnapshotBundle,
        owner_id: int,
        identity_policy: IdentityPolicy,
    ) -> ProjectImportResult:
        self._require_disciplines(snapshot)
        if identity_policy == "preserve":
            self._require_no_identity_conflicts(snapshot)

        project_data = snapshot.project
        project = Project.objects.create(
            uuid=self._identity(project_data.ref, identity_policy),
            owner_id=owner_id,
            title=project_data.title,
            description=project_data.description,
            is_published=project_data.is_published,
            is_archived=project_data.is_archived,
            is_template=project_data.is_template,
        )
        project.disciplines.set(
            Discipline.objects.filter(code__in=project_data.discipline_codes)
        )

        tag_map = {
            tag_data.ref: Tag.objects.create(
                project=project,
                label=tag_data.label,
                translation_plural=tag_data.translation_plural,
            )
            for tag_data in project_data.tags
        }

        workflow_map: dict[str, Workflow] = {}
        graph_map: dict[str, Graph] = {}
        for workflow_data in project_data.workflows:
            graph = Graph.objects.create(
                uuid=self._identity(workflow_data.graph.ref, identity_policy),
                revision_id=workflow_data.graph.revision_id,
            )
            workflow = Workflow.objects.create(
                uuid=self._identity(workflow_data.ref, identity_policy),
                author_id=owner_id,
                graph=graph,
                project=project,
                title=workflow_data.title,
                description=workflow_data.description,
                is_archived=workflow_data.is_archived,
                public_link_enabled=workflow_data.public_link_enabled,
                workflow_type=workflow_data.workflow_type,
            )
            self._write_workflow_metadata(workflow, workflow_data.metadata)
            workflow_map[workflow_data.ref] = workflow
            graph_map[workflow_data.graph.ref] = graph

        total_nodes = 0
        total_outcomes = 0
        for workflow_data in project_data.workflows:
            graph = graph_map[workflow_data.graph.ref]
            section_map = {
                data.ref: Section.objects.create(
                    uuid=self._identity(data.ref, identity_policy),
                    graph=graph,
                    title=data.title,
                    title_copy_count=data.title_copy_count,
                    position=data.position,
                )
                for data in workflow_data.graph.sections
            }
            channel_map = {
                data.ref: Channel.objects.create(
                    uuid=self._identity(data.ref, identity_policy),
                    graph=graph,
                    title=data.title,
                    system_label_code=data.system_label_code,
                    title_copy_count=data.title_copy_count,
                    colour=data.colour,
                    position=data.position,
                )
                for data in workflow_data.graph.channels
            }
            outcome_map = self._write_outcomes(
                graph=graph,
                outcomes=workflow_data.graph.outcomes,
                identity_policy=identity_policy,
            )
            node_map: dict[str, Node] = {}
            for data in workflow_data.graph.nodes:
                node = Node.objects.create(
                    uuid=self._identity(data.ref, identity_policy),
                    section=section_map[data.section_ref],
                    channel=channel_map[data.channel_ref],
                    workflow=workflow_map[workflow_data.ref],
                    linked_workflow=(
                        workflow_map[data.linked_workflow_ref]
                        if data.linked_workflow_ref is not None
                        else None
                    ),
                    section_row=data.section_row,
                    node_type=data.node_type,
                    title=data.title,
                    title_copy_count=data.title_copy_count,
                    description=data.description,
                )
                self._write_node_metadata(node, data.metadata)
                node_map[data.ref] = node
                NodeTag.objects.bulk_create(
                    [NodeTag(node=node, tag=tag_map[ref]) for ref in data.tag_refs]
                )
                NodeOutcome.objects.bulk_create(
                    [
                        NodeOutcome(node=node, outcome=outcome_map[ref])
                        for ref in data.outcome_refs
                    ]
                )

            Edge.objects.bulk_create(
                [
                    Edge(
                        source_node=node_map[data.source_node_ref],
                        target_node=node_map[data.target_node_ref],
                        title=data.title,
                        text_position=data.text_position,
                        line_type=data.line_type,
                        source_port=data.source_port,
                        target_port=data.target_port,
                    )
                    for data in workflow_data.graph.edges
                ]
            )
            for outcome_data in workflow_data.graph.outcomes:
                OutcomeTag.objects.bulk_create(
                    [
                        OutcomeTag(
                            outcome=outcome_map[outcome_data.ref],
                            tag=tag_map[ref],
                        )
                        for ref in outcome_data.tag_refs
                    ]
                )
            for data in workflow_data.graph.horizontal_outcomes:
                group = Horizontaloutcome.objects.create(
                    uuid=self._identity(data.ref, identity_policy)
                )
                HorizontaloutcomeOutcome.objects.bulk_create(
                    [
                        HorizontaloutcomeOutcome(
                            horizontal_outcome=group,
                            outcome=outcome_map[ref],
                        )
                        for ref in data.outcome_refs
                    ]
                )
            total_nodes += len(node_map)
            total_outcomes += len(outcome_map)

        return ProjectImportResult(
            project_uuid=project.uuid,
            workflow_count=len(workflow_map),
            node_count=total_nodes,
            outcome_count=total_outcomes,
        )

    @staticmethod
    def _require_disciplines(snapshot: ProjectSnapshotBundle) -> None:
        requested = set(snapshot.project.discipline_codes)
        existing = set(
            Discipline.objects.filter(code__in=requested).values_list("code", flat=True)
        )
        missing = requested - existing
        if missing:
            raise ProjectSnapshotImportError(
                f"unknown discipline codes: {', '.join(sorted(missing))}"
            )

    @staticmethod
    def _require_no_identity_conflicts(snapshot: ProjectSnapshotBundle) -> None:
        checks: list[tuple[type, list[UUID]]] = [
            (Project, [_parse_uuid(snapshot.project.ref)]),
            (
                Workflow,
                [_parse_uuid(workflow.ref) for workflow in snapshot.project.workflows],
            ),
            (
                Graph,
                [
                    _parse_uuid(workflow.graph.ref)
                    for workflow in snapshot.project.workflows
                ],
            ),
            (
                Section,
                [
                    _parse_uuid(section.ref)
                    for workflow in snapshot.project.workflows
                    for section in workflow.graph.sections
                ],
            ),
            (
                Channel,
                [
                    _parse_uuid(channel.ref)
                    for workflow in snapshot.project.workflows
                    for channel in workflow.graph.channels
                ],
            ),
            (
                Node,
                [
                    _parse_uuid(node.ref)
                    for workflow in snapshot.project.workflows
                    for node in workflow.graph.nodes
                ],
            ),
            (
                Outcome,
                [
                    _parse_uuid(outcome.ref)
                    for workflow in snapshot.project.workflows
                    for outcome in workflow.graph.outcomes
                ],
            ),
            (
                Horizontaloutcome,
                [
                    _parse_uuid(group.ref)
                    for workflow in snapshot.project.workflows
                    for group in workflow.graph.horizontal_outcomes
                ],
            ),
        ]
        for model, identities in checks:
            if identities and model.objects.filter(uuid__in=identities).exists():
                raise ProjectSnapshotImportConflict(
                    f"{model.__name__} identity from the snapshot already exists"
                )

    @staticmethod
    def _identity(ref: str, policy: IdentityPolicy) -> UUID:
        return _parse_uuid(ref) if policy == "preserve" else uuid4()

    @staticmethod
    def _write_workflow_metadata(workflow: Workflow, data) -> None:
        values = data.model_dump(exclude={"kind"})
        if data.kind == "activity":
            meta = Activitymeta.objects.get(workflow=workflow)
        elif data.kind == "course":
            meta = Coursemeta.objects.get(workflow=workflow)
        else:
            meta = Programmeta.objects.get(workflow=workflow)
            values["classification_general_time"] = _seconds_to_timedelta(
                values.pop("classification_general_seconds")
            )
            values["classification_specific_time"] = _seconds_to_timedelta(
                values.pop("classification_specific_seconds")
            )
        for field, value in values.items():
            setattr(meta, field, value)
        meta.save(update_fields=list(values))

    @staticmethod
    def _write_node_metadata(node: Node, data) -> None:
        values = data.model_dump(exclude={"kind"})
        if data.kind == "activity":
            meta = Activitymeta.objects.get(node=node)
        elif data.kind == "course":
            meta = Coursemeta.objects.get(node=node)
        else:
            meta = Taskmeta.objects.get(node=node)
        for field, value in values.items():
            setattr(meta, field, value)
        meta.save(update_fields=list(values))

    def _write_outcomes(self, *, graph, outcomes, identity_policy):
        outcome_map: dict[str, Outcome] = {}
        pending = {outcome.ref: outcome for outcome in outcomes}
        while pending:
            ready = [
                data
                for data in pending.values()
                if data.parent_ref is None or data.parent_ref in outcome_map
            ]
            if not ready:
                raise ProjectSnapshotImportError(
                    "outcome hierarchy could not be written in parent-first order"
                )
            for data in ready:
                outcome_map[data.ref] = Outcome.objects.create(
                    uuid=self._identity(data.ref, identity_policy),
                    graph=graph,
                    parent=(
                        outcome_map[data.parent_ref]
                        if data.parent_ref is not None
                        else None
                    ),
                    order=data.order,
                    title=data.title,
                    title_copy_count=data.title_copy_count,
                    description=data.description,
                    code=data.code,
                )
                del pending[data.ref]
        return outcome_map


def _parse_uuid(ref: str) -> UUID:
    try:
        return UUID(ref)
    except ValueError as exc:
        raise ProjectSnapshotImportError(
            f"identity policy 'preserve' requires UUID references; got {ref!r}"
        ) from exc


def _seconds_to_timedelta(value: Decimal | None) -> timedelta | None:
    if value is None:
        return None
    microseconds = int(value * Decimal(1_000_000))
    return timedelta(microseconds=microseconds)
