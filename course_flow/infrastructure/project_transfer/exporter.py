"""Django ORM adapter that exports one complete v2 project aggregate."""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from uuid import UUID

from django.db.models import Q
from django.utils import timezone

from course_flow.application.project_transfer.contract import (
    ActivityMetaSnapshot,
    ChannelSnapshot,
    CourseMetaSnapshot,
    EdgeSnapshot,
    ExclusionSnapshot,
    GraphSnapshot,
    HorizontalOutcomeSnapshot,
    NodeSnapshot,
    OutcomeSnapshot,
    ProgramMetaSnapshot,
    ProjectSnapshot,
    ProjectSnapshotBundle,
    SectionSnapshot,
    TagSnapshot,
    TaskMetaSnapshot,
    WorkflowSnapshot,
)
from course_flow.core.models import (
    Comment,
    Edge,
    FavoriteGraph,
    FavoriteProject,
    Horizontaloutcome,
    Node,
    Project,
    Tag,
    TeamUser,
    Workflow,
    WorkspaceEditLock,
)


class ProjectSnapshotExportError(ValueError):
    """Raised when ORM state cannot be represented without losing content."""


class DjangoProjectSnapshotExporter:
    def export(
        self,
        *,
        project_uuid: UUID,
        source_system: str,
    ) -> ProjectSnapshotBundle:
        try:
            project = Project.objects.prefetch_related("disciplines", "tags").get(
                uuid=project_uuid
            )
        except Project.DoesNotExist as exc:
            raise ProjectSnapshotExportError(
                f"project {project_uuid} does not exist"
            ) from exc

        workflows = list(
            Workflow.objects.filter(project=project)
            .select_related(
                "graph",
                "activitymeta",
                "coursemeta",
                "programmeta",
            ).order_by("uuid")
        )
        workflow_ids = {workflow.id for workflow in workflows}
        workflow_refs = {workflow.id: str(workflow.uuid) for workflow in workflows}

        external_links = Node.objects.filter(
            workflow_id__in=workflow_ids,
            linked_workflow__isnull=False,
        ).exclude(linked_workflow_id__in=workflow_ids)
        if external_links.exists():
            raise ProjectSnapshotExportError(
                "project contains node links to workflows outside the export closure"
            )

        tags = list(
            Tag.objects.filter(project=project).order_by(
                "label",
                "translation_plural",
                "id",
            )
        )
        tag_refs = {tag.id: f"tag:{index}" for index, tag in enumerate(tags)}
        workflow_snapshots = tuple(
            self._export_workflow(
                workflow,
                workflow_refs=workflow_refs,
                tag_refs=tag_refs,
            )
            for workflow in workflows
        )

        project_snapshot = ProjectSnapshot(
            ref=str(project.uuid),
            title=project.title,
            description=project.description,
            is_published=project.is_published,
            is_archived=project.is_archived,
            is_template=project.is_template,
            discipline_codes=tuple(
                project.disciplines.order_by("code").values_list("code", flat=True)
            ),
            tags=tuple(
                TagSnapshot(
                    ref=tag_refs[tag.id],
                    label=tag.label,
                    translation_plural=tag.translation_plural,
                )
                for tag in tags
            ),
            workflows=workflow_snapshots,
        )
        return ProjectSnapshotBundle.build(
            source_system=source_system,
            exported_at=timezone.now(),
            exclusions=self._exclusions(project, workflows),
            project=project_snapshot,
        )

    def _export_workflow(self, workflow, *, workflow_refs, tag_refs) -> WorkflowSnapshot:
        graph = workflow.graph
        sections = list(graph.sections.order_by("position", "id"))
        channels = list(graph.channels.order_by("position", "id"))
        outcomes = _order_outcomes(
            list(graph.outcomes.prefetch_related("tags").order_by("id"))
        )
        nodes = list(
            workflow.nodes.select_related(
                "section",
                "channel",
                "linked_workflow",
                "activitymeta",
                "coursemeta",
                "taskmeta",
            )
            .prefetch_related("tags", "outcomes")
            .order_by(
                "section__position",
                "section_row",
                "channel__position",
                "uuid",
            )
        )

        section_refs = {section.id: str(section.uuid) for section in sections}
        channel_refs = {channel.id: str(channel.uuid) for channel in channels}
        node_refs = {node.id: str(node.uuid) for node in nodes}
        outcome_refs = {outcome.id: str(outcome.uuid) for outcome in outcomes}
        outcome_positions = {
            outcome.id: position for position, outcome in enumerate(outcomes)
        }

        referenced_tag_ids = {
            tag.id
            for entity in (*nodes, *outcomes)
            for tag in entity.tags.all()
        }
        unknown_tag_ids = referenced_tag_ids - set(tag_refs)
        if unknown_tag_ids:
            raise ProjectSnapshotExportError(
                f"workflow {workflow.uuid} references tags not owned by the project"
            )

        edges = list(
            Edge.objects.filter(
                source_node_id__in=node_refs,
                target_node_id__in=node_refs,
            ).order_by("id")
        )
        horizontal_groups = list(
            Horizontaloutcome.objects.filter(outcomes__graph=graph)
            .prefetch_related("outcomes")
            .distinct()
            .order_by("uuid")
        )
        horizontal_snapshots: list[HorizontalOutcomeSnapshot] = []
        for group in horizontal_groups:
            group_outcomes = sorted(
                group.outcomes.all(),
                key=lambda outcome: outcome_positions.get(outcome.id, -1),
            )
            if any(outcome.id not in outcome_refs for outcome in group_outcomes):
                raise ProjectSnapshotExportError(
                    f"horizontal outcome {group.uuid} crosses a workflow boundary"
                )
            horizontal_snapshots.append(
                HorizontalOutcomeSnapshot(
                    ref=str(group.uuid),
                    outcome_refs=tuple(
                        outcome_refs[outcome.id] for outcome in group_outcomes
                    ),
                )
            )

        return WorkflowSnapshot(
            ref=str(workflow.uuid),
            title=workflow.title,
            description=workflow.description,
            is_archived=workflow.is_archived,
            public_link_enabled=workflow.public_link_enabled,
            workflow_type=workflow.workflow_type,
            metadata=self._workflow_metadata(workflow),
            graph=GraphSnapshot(
                ref=str(graph.uuid),
                revision_id=graph.revision_id,
                sections=tuple(
                    SectionSnapshot(
                        ref=section_refs[section.id],
                        title=section.title,
                        title_copy_count=section.title_copy_count,
                        position=section.position,
                    )
                    for section in sections
                ),
                channels=tuple(
                    ChannelSnapshot(
                        ref=channel_refs[channel.id],
                        title=channel.title,
                        system_label_code=channel.system_label_code,
                        title_copy_count=channel.title_copy_count,
                        colour=channel.colour,
                        position=channel.position,
                    )
                    for channel in channels
                ),
                outcomes=tuple(
                    OutcomeSnapshot(
                        ref=outcome_refs[outcome.id],
                        parent_ref=(
                            outcome_refs[outcome.parent_id]
                            if outcome.parent_id is not None
                            else None
                        ),
                        order=outcome.order,
                        title=outcome.title,
                        title_copy_count=outcome.title_copy_count,
                        description=outcome.description,
                        code=outcome.code,
                        tag_refs=tuple(
                            tag_refs[tag.id] for tag in outcome.tags.all()
                        ),
                    )
                    for outcome in outcomes
                ),
                nodes=tuple(
                    NodeSnapshot(
                        ref=node_refs[node.id],
                        section_ref=section_refs[node.section_id],
                        channel_ref=channel_refs[node.channel_id],
                        linked_workflow_ref=(
                            workflow_refs[node.linked_workflow_id]
                            if node.linked_workflow_id is not None
                            else None
                        ),
                        section_row=node.section_row,
                        node_type=node.node_type,
                        title=node.title,
                        title_copy_count=node.title_copy_count,
                        description=node.description,
                        metadata=self._node_metadata(node),
                        tag_refs=tuple(tag_refs[tag.id] for tag in node.tags.all()),
                        outcome_refs=tuple(
                            outcome_refs[outcome.id]
                            for outcome in sorted(
                                node.outcomes.all(),
                                key=lambda item: outcome_positions[item.id],
                            )
                        ),
                    )
                    for node in nodes
                ),
                edges=tuple(
                    EdgeSnapshot(
                        ref=f"edge:{index}",
                        source_node_ref=node_refs[edge.source_node_id],
                        target_node_ref=node_refs[edge.target_node_id],
                        title=edge.title,
                        text_position=edge.text_position,
                        line_type=edge.line_type,
                        source_port=edge.source_port,
                        target_port=edge.target_port,
                    )
                    for index, edge in enumerate(edges)
                ),
                horizontal_outcomes=tuple(horizontal_snapshots),
            ),
        )

    @staticmethod
    def _workflow_metadata(workflow):
        if workflow.workflow_type == "activity":
            meta = workflow.activitymeta
            return ActivityMetaSnapshot(
                calculate_time=meta.calculate_time,
                context_classification=meta.context_classification,
                task_classification=meta.task_classification,
                time_required=meta.time_required,
                time_units=meta.time_units,
                represents_workflow=meta.represents_workflow,
                context=meta.context,
                classification=meta.classification,
            )
        if workflow.workflow_type == "course":
            meta = workflow.coursemeta
            return CourseMetaSnapshot(
                calculate_time=meta.calculate_time,
                time_required=meta.time_required,
                time_units=meta.time_units,
                ponderation_theory=meta.ponderation_theory,
                ponderation_practice=meta.ponderation_practice,
                ponderation_individual=meta.ponderation_individual,
                credits=meta.credits,
                specific_education=meta.specific_education,
                classification=meta.classification,
                code=meta.code,
            )
        if workflow.workflow_type == "program":
            meta = workflow.programmeta
            return ProgramMetaSnapshot(
                code=meta.code,
                calculate_time=meta.calculate_time,
                calculate_credits=meta.calculate_credits,
                calculate_ponderation=meta.calculate_ponderation,
                calculate_classification=meta.calculate_classification,
                time_required=meta.time_required,
                time_units=meta.time_units,
                ponderation_theory=meta.ponderation_theory,
                ponderation_practice=meta.ponderation_practice,
                ponderation_individual=meta.ponderation_individual,
                credits=meta.credits,
                classification_general_seconds=_duration_seconds(
                    meta.classification_general_time
                ),
                classification_specific_seconds=_duration_seconds(
                    meta.classification_specific_time
                ),
            )
        raise ProjectSnapshotExportError(
            f"unsupported root workflow type {workflow.workflow_type!r}"
        )

    @staticmethod
    def _node_metadata(node):
        if node.node_type == "activity":
            meta = node.activitymeta
            return ActivityMetaSnapshot(
                calculate_time=meta.calculate_time,
                context_classification=meta.context_classification,
                task_classification=meta.task_classification,
                time_required=meta.time_required,
                time_units=meta.time_units,
                represents_workflow=meta.represents_workflow,
                context=meta.context,
                classification=meta.classification,
            )
        if node.node_type == "course":
            meta = node.coursemeta
            return CourseMetaSnapshot(
                calculate_time=meta.calculate_time,
                time_required=meta.time_required,
                time_units=meta.time_units,
                ponderation_theory=meta.ponderation_theory,
                ponderation_practice=meta.ponderation_practice,
                ponderation_individual=meta.ponderation_individual,
                credits=meta.credits,
                specific_education=meta.specific_education,
                classification=meta.classification,
                code=meta.code,
            )
        if node.node_type == "task":
            meta = node.taskmeta
            return TaskMetaSnapshot(
                context_classification=meta.context_classification,
                task_classification=meta.task_classification,
                time_required=meta.time_required,
                time_units=meta.time_units,
                represents_workflow=meta.represents_workflow,
                context=meta.context,
            )
        raise ProjectSnapshotExportError(f"unsupported node type {node.node_type!r}")

    @staticmethod
    def _exclusions(project, workflows) -> tuple[ExclusionSnapshot, ...]:
        workflow_ids = [workflow.id for workflow in workflows]
        graph_ids = [workflow.graph_id for workflow in workflows]
        thread_ids = set()
        for workflow in workflows:
            graph = workflow.graph
            thread_ids.update(graph.sections.values_list("thread_id", flat=True))
            thread_ids.update(graph.channels.values_list("thread_id", flat=True))
            thread_ids.update(graph.outcomes.values_list("thread_id", flat=True))
            thread_ids.update(workflow.nodes.values_list("thread_id", flat=True))
        thread_ids.discard(None)

        counts = {
            "comments": Comment.objects.filter(thread_id__in=thread_ids).count(),
            "team_members": TeamUser.objects.filter(team=project.team).count(),
            "favourites": FavoriteProject.objects.filter(project=project).count()
            + FavoriteGraph.objects.filter(graph_id__in=graph_ids).count(),
            "workspace_edit_locks": WorkspaceEditLock.objects.filter(
                Q(project=project) | Q(workflow_id__in=workflow_ids)
            ).count(),
        }
        reasons = {
            "comments": "Collaboration history is not portable project content.",
            "team_members": "Destination ownership and access are assigned by import policy.",
            "favourites": "Favourites are user-local state.",
            "workspace_edit_locks": "Edit leases are transient operational state.",
        }
        return tuple(
            ExclusionSnapshot(kind=kind, count=count, reason=reasons[kind])
            for kind, count in counts.items()
        )


def _duration_seconds(value: timedelta | None) -> Decimal | None:
    if value is None:
        return None
    whole_seconds = value.days * 86400 + value.seconds
    return Decimal(whole_seconds) + (Decimal(value.microseconds) / Decimal(1_000_000))


def _order_outcomes(outcomes) -> list:
    """Return canonical parent-first tree order independent of database PKs."""
    children_by_parent: dict[int | None, list] = {}
    for outcome in outcomes:
        children_by_parent.setdefault(outcome.parent_id, []).append(outcome)
    for siblings in children_by_parent.values():
        siblings.sort(key=lambda outcome: (outcome.order, str(outcome.uuid)))

    ordered: list = []

    def visit(parent_id: int | None) -> None:
        for outcome in children_by_parent.get(parent_id, []):
            ordered.append(outcome)
            visit(outcome.id)

    visit(None)
    if len(ordered) != len(outcomes):
        raise ProjectSnapshotExportError("outcome hierarchy is cyclic or disconnected")
    return ordered
