"""Transactional deep-copy operation for workflows."""

from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from django.db import transaction

from course_flow.application.services.authorization_service import (
    AuthorizationDenied,
    AuthorizationService,
)
from course_flow.core.models import (
    Channel,
    Edge,
    Graph,
    Node,
    NodeOutcome,
    NodeTag,
    Outcome,
    OutcomeTag,
    Project,
    Section,
    User,
    Workflow,
)
from course_flow.core.node_meta import copy_node_typed_meta
from course_flow.core.permissions import ProjectPermission, WorkflowPermission


class WorkflowCopySourceNotFound(LookupError):
    """Raised when the requested source workflow does not exist."""


class WorkflowCopyDestinationNotFound(LookupError):
    """Raised when the requested destination project does not exist."""


class WorkflowCopyValidationError(ValueError):
    """Raised when the requested copy attributes are invalid."""


class WorkflowCopyService:
    """Clone a workflow and its owned graph content as one atomic operation."""

    def __init__(self, authorization: AuthorizationService | None = None) -> None:
        self._authorization = authorization or AuthorizationService()

    @transaction.atomic
    def copy(
        self,
        *,
        source_workflow_uuid: UUID,
        destination_project_uuid: UUID,
        title: str,
        actor: User,
    ) -> Workflow:
        clean_title = (title or "").strip()
        if not clean_title:
            raise WorkflowCopyValidationError("Title is required")
        if len(clean_title) > 200:
            raise WorkflowCopyValidationError(
                "Title cannot be longer than 200 characters"
            )

        try:
            source_graph = (
                Graph.objects.select_for_update(of=("self",))
                .select_related("workflow__project")
                .get(workflow__uuid=source_workflow_uuid)
            )
        except Graph.DoesNotExist as exc:
            raise WorkflowCopySourceNotFound from exc

        try:
            destination_project = Project.objects.select_for_update().get(
                uuid=destination_project_uuid
            )
        except Project.DoesNotExist as exc:
            raise WorkflowCopyDestinationNotFound from exc

        source_workflow = source_graph.workflow
        self._require_source_copy_access(actor=actor, source=source_workflow)
        self._authorization.require_project(
            user=actor,
            project=destination_project,
            action=ProjectPermission.CREATE_WORKFLOW,
        )

        destination_graph = Graph.objects.create()
        destination_workflow = Workflow.objects.create(
            graph=destination_graph,
            author=actor,
            project=destination_project,
            title=clean_title,
            description=source_workflow.description,
            workflow_type=source_workflow.workflow_type,
            is_archived=False,
        )

        same_project = source_workflow.project_id == destination_project.id
        self._copy_workflow_typed_meta(
            source=source_workflow,
            destination=destination_workflow,
        )
        section_map = self._copy_sections(
            source_graph=source_graph,
            destination_graph=destination_graph,
        )
        channel_map = self._copy_channels(
            source_graph=source_graph,
            destination_graph=destination_graph,
        )
        outcome_map = self._copy_outcomes(
            source_graph=source_graph,
            destination_graph=destination_graph,
            preserve_tags=same_project,
        )
        node_map = self._copy_nodes(
            source_workflow=source_workflow,
            destination_workflow=destination_workflow,
            section_map=section_map,
            channel_map=channel_map,
            preserve_project_scoped_relations=same_project,
        )
        self._copy_edges(source_graph=source_graph, node_map=node_map)
        self._copy_node_outcome_assignments(
            source_graph=source_graph,
            node_map=node_map,
            outcome_map=outcome_map,
        )
        return destination_workflow

    def _require_source_copy_access(self, *, actor: User, source: Workflow) -> None:
        try:
            self._authorization.require_workflow(
                user=actor,
                workflow=source,
                action=WorkflowPermission.COPY,
            )
            return
        except AuthorizationDenied:
            # A published template is a product-curated copy source. Public users
            # can consume it from VIEW without receiving COPY on every public
            # workflow in the permission matrix.
            if source.project is None or not source.project.is_template:
                raise

        self._authorization.require_workflow(
            user=actor,
            workflow=source,
            action=WorkflowPermission.VIEW,
        )

    def _copy_workflow_typed_meta(
        self,
        *,
        source: Workflow,
        destination: Workflow,
    ) -> None:
        source_activity = getattr(source, "activitymeta", None)
        destination_activity = getattr(destination, "activitymeta", None)
        if source_activity is not None and destination_activity is not None:
            self._copy_model_fields(
                source_activity,
                destination_activity,
                (
                    "context_classification",
                    "task_classification",
                    "time_required",
                    "time_units",
                    "represents_workflow",
                    "context",
                    "classification",
                ),
            )

        source_course = getattr(source, "coursemeta", None)
        destination_course = getattr(destination, "coursemeta", None)
        if source_course is not None and destination_course is not None:
            self._copy_model_fields(
                source_course,
                destination_course,
                ("classification", "code"),
            )

        source_program = getattr(source, "programmeta", None)
        destination_program = getattr(destination, "programmeta", None)
        if source_program is not None and destination_program is not None:
            self._copy_model_fields(
                source_program,
                destination_program,
                (
                    "calculate_time",
                    "calculate_credits",
                    "calculate_ponderation",
                    "calculate_classification",
                    "classification_general_time",
                    "classification_specific_time",
                ),
            )

    @staticmethod
    def _copy_model_fields(source, destination, fields: tuple[str, ...]) -> None:
        for field in fields:
            setattr(destination, field, getattr(source, field))
        destination.save(update_fields=list(fields))

    def _copy_sections(
        self,
        *,
        source_graph: Graph,
        destination_graph: Graph,
    ) -> dict[int, Section]:
        section_map: dict[int, Section] = {}
        for source in source_graph.sections.all().order_by("position", "id"):
            section_map[source.id] = Section.objects.create(
                graph=destination_graph,
                title=source.title,
                position=source.position,
            )
        return section_map

    def _copy_channels(
        self,
        *,
        source_graph: Graph,
        destination_graph: Graph,
    ) -> dict[int, Channel]:
        channel_map: dict[int, Channel] = {}
        for source in source_graph.channels.all().order_by("position", "id"):
            channel_map[source.id] = Channel.objects.create(
                graph=destination_graph,
                title=source.title,
                colour=source.colour,
                position=source.position,
            )
        return channel_map

    def _copy_outcomes(
        self,
        *,
        source_graph: Graph,
        destination_graph: Graph,
        preserve_tags: bool,
    ) -> dict[int, Outcome]:
        sources = list(
            Outcome.objects.filter(graph=source_graph)
            .prefetch_related("tags")
            .order_by("order", "id")
        )
        children_by_parent: dict[int | None, list[Outcome]] = defaultdict(list)
        for source in sources:
            children_by_parent[source.parent_id].append(source)

        outcome_map: dict[int, Outcome] = {}

        def copy_children(
            parent_id: int | None,
            destination_parent: Outcome | None,
        ) -> None:
            for source in children_by_parent[parent_id]:
                destination = Outcome.objects.create(
                    graph=destination_graph,
                    parent=destination_parent,
                    order=source.order,
                    title=source.title,
                    description=source.description,
                    code=source.code,
                )
                outcome_map[source.id] = destination
                if preserve_tags:
                    OutcomeTag.objects.bulk_create(
                        [
                            OutcomeTag(outcome=destination, tag=tag)
                            for tag in source.tags.all()
                        ]
                    )
                copy_children(source.id, destination)

        copy_children(None, None)
        return outcome_map

    def _copy_nodes(
        self,
        *,
        source_workflow: Workflow,
        destination_workflow: Workflow,
        section_map: dict[int, Section],
        channel_map: dict[int, Channel],
        preserve_project_scoped_relations: bool,
    ) -> dict[int, Node]:
        sources = (
            Node.objects.filter(workflow=source_workflow)
            .select_related(
                "linked_workflow",
                "activitymeta",
                "coursemeta",
                "taskmeta",
            )
            .prefetch_related("tags")
            .order_by("section_id", "section_row", "channel_id", "id")
        )
        node_map: dict[int, Node] = {}
        for source in sources:
            destination = Node.objects.create(
                section=section_map[source.section_id],
                channel=channel_map[source.channel_id],
                workflow=destination_workflow,
                linked_workflow=(
                    source.linked_workflow
                    if preserve_project_scoped_relations
                    else None
                ),
                section_row=source.section_row,
                node_type=source.node_type,
                title=source.title,
                description=source.description,
            )
            copy_node_typed_meta(source=source, target=destination)
            if preserve_project_scoped_relations:
                NodeTag.objects.bulk_create(
                    [NodeTag(node=destination, tag=tag) for tag in source.tags.all()]
                )
            node_map[source.id] = destination
        return node_map

    def _copy_edges(self, *, source_graph: Graph, node_map: dict[int, Node]) -> None:
        source_node_ids = set(node_map)
        edges = Edge.objects.filter(
            source_node_id__in=source_node_ids,
            target_node_id__in=source_node_ids,
        ).order_by("id")
        Edge.objects.bulk_create(
            [
                Edge(
                    source_node=node_map[source.source_node_id],
                    target_node=node_map[source.target_node_id],
                    title=source.title,
                    text_position=source.text_position,
                    line_type=source.line_type,
                    source_port=source.source_port,
                    target_port=source.target_port,
                )
                for source in edges
            ]
        )

    def _copy_node_outcome_assignments(
        self,
        *,
        source_graph: Graph,
        node_map: dict[int, Node],
        outcome_map: dict[int, Outcome],
    ) -> None:
        assignments = NodeOutcome.objects.filter(
            node_id__in=set(node_map),
            outcome_id__in=set(outcome_map),
            outcome__graph=source_graph,
        ).order_by("id")
        NodeOutcome.objects.bulk_create(
            [
                NodeOutcome(
                    node=node_map[source.node_id],
                    outcome=outcome_map[source.outcome_id],
                )
                for source in assignments
            ]
        )
