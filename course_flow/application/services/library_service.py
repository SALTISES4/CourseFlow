from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum
from typing import Any
from uuid import UUID

from django.db.models import Q, QuerySet

from course_flow.api.schemas.library import LibraryFavoriteOut
from course_flow.core.models import (
    FavoriteGraph,
    FavoriteProject,
    Graph,
    Project,
)


class LibraryObjectType(str, Enum):
    PROJECT = "project"
    WORKFLOW = "workflow"

@dataclass
class LibraryObject:
    id: int
    type: LibraryObjectType
    uuid: UUID

class LibraryService:
    def search(
        self,
        *,
        user_id: int,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload = payload or {}
        pagination = payload.get("pagination") or {}
        sort = payload.get("sort") or {}
        filters = payload.get("filters") or []

        page = max(int(pagination.get("page", 0) or 0), 0)
        results_per_page = max(int(pagination.get("results_per_page", 10) or 10), 1)
        sort_value = str(sort.get("value", "DATE_CREATED") or "DATE_CREATED").upper()
        sort_direction = str(sort.get("direction", "DESC") or "DESC").upper()

        normalized_filters = self._normalize_filters(filters)
        workspace_type = normalized_filters.get("workspacetype")
        project_filter_uuid = self._parse_uuid(normalized_filters.get("project"))
        discipline_ids = self._normalize_int_list(normalized_filters.get("discipline"))
        keyword = self._normalize_keyword(normalized_filters.get("keyword"))
        is_template = self._normalize_bool(normalized_filters.get("istemplate"))
        is_favorite = self._normalize_bool(
            normalized_filters.get("isfavorite")
            or normalized_filters.get("favourited")
        )

        accessible_projects = Project.objects.filter(
            Q(owner_id=user_id) | Q(team__users__user_id=user_id)
        ).distinct()

        project_qs = accessible_projects
        graph_qs = Graph.objects.select_related("workflow", "workflow__project").filter(
            workflow__project_id__in=accessible_projects.values("id"),
        )

        if workspace_type == "project":
            graph_qs = graph_qs.none()
        elif workspace_type in {"activity", "course", "program", "task"}:
            project_qs = project_qs.none()
            graph_qs = graph_qs.filter(workflow__workflow_type=workspace_type)

        if project_filter_uuid is not None:
            project_qs = project_qs.filter(uuid=project_filter_uuid)
            graph_qs = graph_qs.filter(workflow__project__uuid=project_filter_uuid)

        if discipline_ids:
            project_qs = project_qs.filter(
                disciplines__id__in=discipline_ids
            ).distinct()
            graph_qs = graph_qs.filter(
                workflow__project__disciplines__id__in=discipline_ids
            ).distinct()

        if is_template is not None:
            project_qs = project_qs.filter(is_template=is_template)
            graph_qs = graph_qs.filter(workflow__project__is_template=is_template)

        if keyword:
            project_qs = project_qs.filter(
                Q(title__icontains=keyword) | Q(description__icontains=keyword)
            )
            graph_qs = graph_qs.filter(
                Q(workflow__title__icontains=keyword)
                | Q(workflow__description__icontains=keyword)
            )

        if is_favorite is True:
            project_qs = project_qs.filter(favorite_links__user_id=user_id)
            graph_qs = graph_qs.filter(favorite_links__user_id=user_id)

        project_favorite_uuids = self._favorite_project_uuids(
            user_id=user_id, project_qs=project_qs
        )

        graph_favorite_uuids = self._favorite_graph_uuids(
            user_id=user_id,
            graph_qs=graph_qs,
        )

        items = self._normalize_project_items(project_qs, project_favorite_uuids)
        items.extend(
            self._normalize_graph_items(graph_qs, graph_favorite_uuids)
        )

        items = self._sort_items(
            items, sort_value=sort_value, sort_direction=sort_direction
        )
        total_results = len(items)
        page_count = (
            math.ceil(total_results / results_per_page) if total_results > 0 else 0
        )
        start_idx = page * results_per_page
        end_idx = start_idx + results_per_page

        return {
            "items": items[start_idx:end_idx],
            "meta": {
                "total_results": total_results,
                "page_count": page_count,
                "current_page": page,
                "results_per_page": results_per_page,
            },
        }

    def toggle_favorite(self, *, user_id: int, uuid: UUID):
        library_item = self._find_from_uuid(uuid)

        TYPE_TO_MODEL_MAP = {
            LibraryObjectType.WORKFLOW: (FavoriteGraph, "graph_id"),
            LibraryObjectType.PROJECT: (FavoriteProject, "project_id"),
        }

        model, field = TYPE_TO_MODEL_MAP[library_item.type]
        obj, created = model.objects.get_or_create(
            user_id=user_id,
            **{field: library_item.id}
        )

        if not created:
            obj.delete()

        return LibraryFavoriteOut(
            user_id=user_id,
            uuid=uuid,
            message="added" if created else "deleted",
        )

    def _find_from_uuid(self, uuid: UUID):
        if uuid is None:
            raise ValueError("UUID is required")

        graph = Graph.objects.filter(uuid=uuid).only("id").first()
        if graph:
            return LibraryObject(
                id=graph.id,
                type=LibraryObjectType.WORKFLOW,
                uuid=uuid,
            )

        project = Project.objects.filter(uuid=uuid).only("id").first()
        if project:
            return LibraryObject(
                id=project.id,
                type=LibraryObjectType.PROJECT,
                uuid=uuid,
            )

        raise ValueError(f"Couldn't find UUID: {uuid}")

    def _normalize_filters(self, filters: list[Any]) -> dict[str, Any]:
        output: dict[str, Any] = {}
        for raw in filters:
            if not isinstance(raw, dict):
                continue
            name = str(raw.get("name", "")).strip().lower()
            if not name:
                continue
            output[name] = raw.get("value")
        return output

    def _normalize_int_list(self, value: Any) -> list[int]:
        if value is None:
            return []
        if not isinstance(value, list):
            value = [value]

        result: list[int] = []
        for raw in value:
            try:
                result.append(int(raw))
            except (TypeError, ValueError):
                continue
        return result

    def _normalize_bool(self, value: Any) -> bool | None:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "1"}:
                return True
            if lowered in {"false", "0"}:
                return False
        return None

    def _normalize_keyword(self, value: Any) -> str | None:
        if not isinstance(value, str):
            return None
        normalized = value.strip()
        return normalized or None

    def _parse_uuid(self, value: Any) -> UUID | None:
        if value is None:
            return None
        try:
            return UUID(str(value))
        except (TypeError, ValueError):
            return None

    def _favorite_project_uuids(
        self, *, user_id: int, project_qs: QuerySet[Project]
    ) -> set[UUID]:
        return set(
            FavoriteProject.objects.filter(
                user_id=user_id, project__in=project_qs
            ).values_list(
                "project__uuid",
                flat=True,
            )
        )

    def _favorite_graph_uuids(
        self, *, user_id: int, graph_qs: QuerySet[Graph]
    ) -> set[UUID]:
        return set(
            FavoriteGraph.objects.filter(
                user_id=user_id,
                graph__in=graph_qs,
            ).values_list("graph__uuid", flat=True)
        )

    def _normalize_project_items(
        self, project_qs: QuerySet[Project], favorite_uuids: set[UUID]
    ) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for project in project_qs:
            rows.append(
                {
                    "object_type": "project",
                    "uuid": project.uuid,
                    "graph_uuid": None,
                    "project_uuid": project.uuid,
                    "workflow_uuid": None,
                    "title": project.title,
                    "description": project.description,
                    "date_created": project.date_created,
                    "modified_on": project.modified_on,
                    "is_template": project.is_template,
                    "is_favorite": project.uuid in favorite_uuids,
                }
            )
        return rows

    def _normalize_graph_items(
        self, graph_qs: QuerySet[Graph], favorite_uuids: set[UUID]
    ) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for graph in graph_qs:
            workflow = graph.workflow
            proj = workflow.project
            rows.append(
                {
                    "object_type": workflow.workflow_type,
                    "uuid": None,
                    "graph_uuid": graph.uuid,
                    "project_uuid": proj.uuid if proj is not None else None,
                    "workflow_uuid": workflow.uuid,
                    "title": workflow.title,
                    "description": workflow.description,
                    "date_created": graph.date_created,
                    "modified_on": graph.modified_on,
                    "is_template": bool(proj and proj.is_template),
                    "is_favorite": graph.uuid in favorite_uuids,
                }
            )
        return rows

    def _sort_items(
        self, items: list[dict[str, Any]], *, sort_value: str, sort_direction: str
    ) -> list[dict[str, Any]]:
        reverse = sort_direction != "ASC"

        if sort_value == "A_Z":
            return sorted(
                items, key=lambda row: row["title"].casefold(), reverse=reverse
            )
        if sort_value == "DATE_MODIFIED":
            return sorted(items, key=lambda row: row["modified_on"], reverse=reverse)
        return sorted(items, key=lambda row: row["date_created"], reverse=reverse)
