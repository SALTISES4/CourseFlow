from datetime import timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from django.db import transaction

from course_flow.application.dto import WorkflowDTO
from course_flow.application.ports import WorkflowRepositoryPort
from course_flow.core.enum import NodeType, WorkflowType
from course_flow.core.models import Graph, Node, Workflow

_GRAPH_SELECT_RELATED = (
    "workflow__project",
    "workflow__activitymeta",
    "workflow__coursemeta",
    "workflow__programmeta",
)


def _optional_float(value) -> float | None:
    return float(value) if value is not None else None


def _duration_hours(value: timedelta | None) -> float | None:
    return value.total_seconds() / 3600 if value is not None else None


def _automatic_flag(value: str) -> bool:
    return value.strip().lower() in {"automatic", "enabled", "true", "1", "on"}


def _overview_metadata(
    workflow: Workflow,
    calculated_workflow_ids: set[int] | None = None,
    *,
    calculate: bool = True,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "code": "",
        "calculate_time_automatically": False,
        "time": None,
        "time_units": None,
        "calculate_ponderation_automatically": False,
        "theory_time": None,
        "practical_time": None,
        "individual_time": None,
        "calculate_credits_automatically": False,
        "credits": None,
        "calculate_classification_automatically": False,
        "general_time": None,
        "specific_time": None,
    }

    if workflow.workflow_type == WorkflowType.ACTIVITY:
        meta = getattr(workflow, "activitymeta", None)
        if meta is not None:
            result.update(
                calculate_time_automatically=meta.calculate_time,
                time=_optional_float(meta.time_required),
                time_units=meta.time_units,
            )
    elif workflow.workflow_type == WorkflowType.COURSE:
        meta = getattr(workflow, "coursemeta", None)
        if meta is not None:
            result.update(
                code=meta.code,
                calculate_time_automatically=meta.calculate_time,
                time=_optional_float(meta.time_required),
                time_units=meta.time_units,
                theory_time=_optional_float(meta.ponderation_theory),
                practical_time=_optional_float(meta.ponderation_practice),
                individual_time=_optional_float(meta.ponderation_individual),
                credits=meta.credits,
            )
    elif workflow.workflow_type == WorkflowType.PROGRAM:
        meta = getattr(workflow, "programmeta", None)
        if meta is not None:
            result.update(
                code=meta.code,
                calculate_time_automatically=_automatic_flag(meta.calculate_time),
                time=_optional_float(meta.time_required),
                time_units=meta.time_units,
                calculate_ponderation_automatically=_automatic_flag(
                    meta.calculate_ponderation
                ),
                theory_time=_optional_float(meta.ponderation_theory),
                practical_time=_optional_float(meta.ponderation_practice),
                individual_time=_optional_float(meta.ponderation_individual),
                calculate_credits_automatically=_automatic_flag(meta.calculate_credits),
                credits=meta.credits,
                calculate_classification_automatically=_automatic_flag(
                    meta.calculate_classification
                ),
                general_time=_duration_hours(meta.classification_general_time),
                specific_time=_duration_hours(meta.classification_specific_time),
            )

    if not calculate:
        return result

    if calculated_workflow_ids is None:
        calculated_workflow_ids = set()
    if workflow.id in calculated_workflow_ids:
        return result
    calculated_workflow_ids.add(workflow.id)

    if result["calculate_time_automatically"]:
        result["time"] = _sum_effective_node_value(
            workflow, "time", calculated_workflow_ids
        )

    if workflow.workflow_type == WorkflowType.PROGRAM:
        if result["calculate_ponderation_automatically"]:
            for key in ("theory_time", "practical_time", "individual_time"):
                result[key] = _sum_effective_node_value(
                    workflow, key, calculated_workflow_ids
                )
        if result["calculate_credits_automatically"]:
            result["credits"] = int(
                _sum_effective_node_value(workflow, "credits", calculated_workflow_ids)
            )
        if result["calculate_classification_automatically"]:
            general_time = 0.0
            specific_time = 0.0
            for values, is_specific in _effective_node_values(
                workflow, calculated_workflow_ids
            ):
                time = float(values.get("time") or 0)
                if is_specific:
                    specific_time += time
                else:
                    general_time += time
            result["general_time"] = general_time
            result["specific_time"] = specific_time

    calculated_workflow_ids.remove(workflow.id)
    return result


def _node_queryset(workflow: Workflow):
    return Node.objects.filter(workflow_id=workflow.id).select_related(
        "activitymeta",
        "coursemeta",
        "taskmeta",
        "linked_workflow__activitymeta",
        "linked_workflow__coursemeta",
        "linked_workflow__programmeta",
    )


def _specific_classification(value: str) -> bool:
    return value.strip().lower() in {
        "specific",
        "specific education",
        "specific_education",
        "true",
        "1",
        "on",
    }


def _local_node_overview_values(node: Node) -> tuple[dict[str, Any], bool]:
    if node.node_type == NodeType.TASK:
        meta = getattr(node, "taskmeta", None)
        return (
            {"time": _optional_float(meta.time_required) if meta else None},
            False,
        )
    if node.node_type == NodeType.ACTIVITY:
        meta = getattr(node, "activitymeta", None)
        return (
            {"time": _optional_float(meta.time_required) if meta else None},
            False,
        )
    if node.node_type == NodeType.COURSE:
        meta = getattr(node, "coursemeta", None)
        if meta is None:
            return {}, False
        return (
            {
                "time": _optional_float(meta.time_required),
                "theory_time": _optional_float(meta.ponderation_theory),
                "practical_time": _optional_float(meta.ponderation_practice),
                "individual_time": _optional_float(meta.ponderation_individual),
                "credits": meta.credits,
            },
            _specific_classification(meta.classification),
        )
    return {}, False


def _effective_node_values(workflow: Workflow, calculated_workflow_ids: set[int]):
    for node in _node_queryset(workflow):
        if node.linked_workflow_id:
            linked = node.linked_workflow
            values = _overview_metadata(linked, calculated_workflow_ids)
            linked_course_meta = getattr(linked, "coursemeta", None)
            yield (
                values,
                bool(
                    linked_course_meta
                    and _specific_classification(linked_course_meta.classification)
                ),
            )
        else:
            yield _local_node_overview_values(node)


def _sum_effective_node_value(
    workflow: Workflow, key: str, calculated_workflow_ids: set[int]
) -> float:
    return sum(
        float(values.get(key) or 0)
        for values, _is_specific in _effective_node_values(
            workflow, calculated_workflow_ids
        )
    )


def _decimal(value: float | None) -> Decimal | None:
    return Decimal(str(value)) if value is not None else None


def _hours(value: float | None) -> timedelta | None:
    return timedelta(hours=value) if value is not None else None


def _identity(value):
    return value


def _string(value: str | None) -> str:
    return value or ""


def _automatic_value(value: bool | None) -> str:
    return "automatic" if value else ""


def _update_overview_metadata(
    workflow: Workflow, updates: dict[str, Any] | None
) -> None:
    if not updates:
        return

    if workflow.workflow_type == WorkflowType.ACTIVITY:
        meta = workflow.activitymeta
        field_map = {
            "calculate_time_automatically": ("calculate_time", bool),
            "time": ("time_required", _decimal),
            "time_units": ("time_units", _identity),
        }
    elif workflow.workflow_type == WorkflowType.COURSE:
        meta = workflow.coursemeta
        field_map = {
            "code": ("code", _string),
            "calculate_time_automatically": ("calculate_time", bool),
            "time": ("time_required", _decimal),
            "time_units": ("time_units", _identity),
            "theory_time": ("ponderation_theory", _decimal),
            "practical_time": ("ponderation_practice", _decimal),
            "individual_time": ("ponderation_individual", _decimal),
            "credits": ("credits", _identity),
        }
    elif workflow.workflow_type == WorkflowType.PROGRAM:
        meta = workflow.programmeta
        field_map = {
            "code": ("code", _string),
            "calculate_time_automatically": (
                "calculate_time",
                _automatic_value,
            ),
            "time": ("time_required", _decimal),
            "time_units": ("time_units", _identity),
            "calculate_ponderation_automatically": (
                "calculate_ponderation",
                _automatic_value,
            ),
            "theory_time": ("ponderation_theory", _decimal),
            "practical_time": ("ponderation_practice", _decimal),
            "individual_time": ("ponderation_individual", _decimal),
            "calculate_credits_automatically": (
                "calculate_credits",
                _automatic_value,
            ),
            "credits": ("credits", _identity),
            "calculate_classification_automatically": (
                "calculate_classification",
                _automatic_value,
            ),
            "general_time": ("classification_general_time", _hours),
            "specific_time": ("classification_specific_time", _hours),
        }
    else:
        return

    changed_fields: list[str] = []
    for input_name, value in updates.items():
        mapping = field_map.get(input_name)
        if mapping is None:
            continue
        model_name, convert = mapping
        setattr(meta, model_name, convert(value))
        changed_fields.append(model_name)
    if changed_fields:
        meta.save(update_fields=changed_fields)


def _to_dto(g: Graph, *, calculate_overview: bool = True) -> WorkflowDTO:
    workflow = g.workflow
    project = workflow.project if workflow.project_id else None
    return WorkflowDTO(
        id=g.id,
        graph_uuid=g.uuid,
        workflow_uuid=workflow.uuid,
        revision_id=g.revision_id,
        author_id=workflow.author_id,
        project_id=workflow.project_id,
        project_uuid=project.uuid if project is not None else None,
        project_owner_id=project.owner_id if project is not None else None,
        project_is_published=project.is_published if project is not None else False,
        project_is_archived=project.is_archived if project is not None else False,
        is_archived=workflow.is_archived,
        public_link_enabled=workflow.public_link_enabled,
        workflow_type=workflow.workflow_type,
        title=workflow.title,
        description=workflow.description,
        overview_metadata=_overview_metadata(workflow, calculate=calculate_overview),
        date_created=g.date_created,
        modified_on=g.modified_on,
    )


class DjangoWorkflowRepository(WorkflowRepositoryPort):
    @transaction.atomic
    def create(
        self,
        *,
        author_id: int,
        project_id: int | None,
        title: str,
        workflow_type: str,
        description: str,
    ) -> WorkflowDTO:
        g = Graph.objects.create()
        clean_title = (title or "").strip()
        if not clean_title:
            raise ValueError("title must not be blank")
        Workflow.objects.create(
            graph=g,
            author_id=author_id,
            project_id=project_id,
            title=clean_title,
            description=description,
            workflow_type=workflow_type,
        )
        g = Graph.objects.select_related(*_GRAPH_SELECT_RELATED).get(pk=g.pk)
        return _to_dto(g)

    def get_by_graph_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        try:
            g = Graph.objects.select_related(*_GRAPH_SELECT_RELATED).get(uuid=uuid)
        except Graph.DoesNotExist:
            return None
        return _to_dto(g)

    def get_by_workflow_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        try:
            wf = Workflow.objects.select_related(
                "graph", "project", "activitymeta", "coursemeta", "programmeta"
            ).get(uuid=uuid)
        except Workflow.DoesNotExist:
            return None
        return _to_dto(wf.graph)

    def list_for_author(self, author_id: int) -> list[WorkflowDTO]:
        qs = (
            Graph.objects.filter(workflow__author_id=author_id)
            .select_related(*_GRAPH_SELECT_RELATED)
            .order_by("-modified_on")
        )
        return [_to_dto(g, calculate_overview=False) for g in qs]

    def list_for_project(self, project_id: int) -> list[WorkflowDTO]:
        qs = (
            Graph.objects.filter(workflow__project_id=project_id)
            .select_related(*_GRAPH_SELECT_RELATED)
            .order_by("-modified_on")
        )
        return [_to_dto(g, calculate_overview=False) for g in qs]

    def list_related(
        self, workflow_uuid: UUID
    ) -> tuple[list[WorkflowDTO], list[WorkflowDTO]]:
        try:
            workflow = Workflow.objects.only("id").get(uuid=workflow_uuid)
        except Workflow.DoesNotExist:
            return [], []

        contains = (
            Graph.objects.filter(
                workflow__nodes_linked_from__workflow_id=workflow.id,
            )
            .select_related(*_GRAPH_SELECT_RELATED)
            .distinct()
            .order_by("workflow__title", "workflow__uuid")
        )
        appears_in = (
            Graph.objects.filter(
                workflow__nodes__linked_workflow_id=workflow.id,
            )
            .select_related(*_GRAPH_SELECT_RELATED)
            .distinct()
            .order_by("workflow__title", "workflow__uuid")
        )
        return (
            [_to_dto(graph, calculate_overview=False) for graph in contains],
            [_to_dto(graph, calculate_overview=False) for graph in appears_in],
        )

    def update(self, graph_uuid: UUID, updates: dict[str, Any]) -> WorkflowDTO | None:
        try:
            g = Graph.objects.select_related(*_GRAPH_SELECT_RELATED).get(
                uuid=graph_uuid
            )
        except Graph.DoesNotExist:
            return None
        wf = g.workflow
        overview_updates = updates.get("overview_metadata")
        changed = False
        if "title" in updates and updates["title"] is not None:
            wf.title = updates["title"]
            changed = True
        if "project_id" in updates:
            wf.project_id = updates["project_id"]
            changed = True
        if "description" in updates and updates["description"] is not None:
            wf.description = updates["description"]
            changed = True
        if "is_archived" in updates and updates["is_archived"] is not None:
            wf.is_archived = updates["is_archived"]
            changed = True
        if (
            "public_link_enabled" in updates
            and updates["public_link_enabled"] is not None
        ):
            wf.public_link_enabled = updates["public_link_enabled"]
            changed = True
        if changed:
            wf.save()
        _update_overview_metadata(wf, overview_updates)
        return _to_dto(g)
