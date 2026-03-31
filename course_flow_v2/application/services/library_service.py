from __future__ import annotations

import math
from typing import Any
from uuid import UUID

from django.db.models import Q, QuerySet

from course_flow_v2.core.models import (
    FavoriteProject,
    FavoriteWorkflow,
    Project,
    Workflow,
)


class LibraryService:
    def search(self, *, user_id: int, payload: dict[str, Any] | None = None) -> dict[str, Any]:
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
        is_template = self._normalize_bool(normalized_filters.get("istemplate"))
        keyword = self._normalize_keyword(normalized_filters.get("keyword"))
        favourited = self._normalize_bool(normalized_filters.get("favourited"))

        accessible_projects = Project.objects.filter(
            Q(owner_id=user_id) | Q(team__members__user_id=user_id)
        ).distinct()

        project_qs = accessible_projects
        workflow_qs = Workflow.objects.select_related("project", "unit").filter(
            project_id__in=accessible_projects.values("id"),
            unit__isnull=False,
        )

        if workspace_type == "project":
            workflow_qs = workflow_qs.none()
        elif workspace_type in {"activity", "course", "program", "task"}:
            project_qs = project_qs.none()
            workflow_qs = workflow_qs.filter(unit__unit_type=workspace_type)

        if project_filter_uuid is not None:
            project_qs = project_qs.filter(uuid=project_filter_uuid)
            workflow_qs = workflow_qs.filter(project__uuid=project_filter_uuid)

        if discipline_ids:
            project_qs = project_qs.filter(disciplines__id__in=discipline_ids).distinct()
            workflow_qs = workflow_qs.filter(project__disciplines__id__in=discipline_ids).distinct()

        if is_template is not None:
            project_qs = project_qs.filter(is_template=is_template)
            workflow_qs = workflow_qs.filter(project__is_template=is_template)

        if keyword:
            project_qs = project_qs.filter(
                Q(title__icontains=keyword) | Q(description__icontains=keyword)
            )
            workflow_qs = workflow_qs.filter(
                Q(unit__title__icontains=keyword)
                | Q(unit__description__icontains=keyword)
                | Q(title__icontains=keyword)
            )

        if favourited is True:
            project_qs = project_qs.filter(favorite_links__user_id=user_id)
            workflow_qs = workflow_qs.filter(favorite_links__user_id=user_id)

        project_favorite_uuids = self._favorite_project_uuids(user_id=user_id, project_qs=project_qs)
        workflow_favorite_uuids = self._favorite_workflow_uuids(
            user_id=user_id,
            workflow_qs=workflow_qs,
        )

        items = self._normalize_project_items(project_qs, project_favorite_uuids)
        items.extend(self._normalize_workflow_items(workflow_qs, workflow_favorite_uuids))

        items = self._sort_items(items, sort_value=sort_value, sort_direction=sort_direction)
        total_results = len(items)
        page_count = math.ceil(total_results / results_per_page) if total_results > 0 else 0
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

    def _favorite_project_uuids(self, *, user_id: int, project_qs: QuerySet[Project]) -> set[UUID]:
        return set(
            FavoriteProject.objects.filter(user_id=user_id, project__in=project_qs).values_list(
                "project__uuid",
                flat=True,
            )
        )

    def _favorite_workflow_uuids(
        self, *, user_id: int, workflow_qs: QuerySet[Workflow]
    ) -> set[UUID]:
        return set(
            FavoriteWorkflow.objects.filter(
                user_id=user_id,
                workflow__in=workflow_qs,
            ).values_list("workflow__uuid", flat=True)
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
                    "workflow_uuid": None,
                    "project_uuid": project.uuid,
                    "unit_uuid": None,
                    "title": project.title,
                    "description": project.description,
                    "date_created": project.date_created,
                    "modified_on": project.modified_on,
                    "is_template": project.is_template,
                    "is_favorite": project.uuid in favorite_uuids,
                }
            )
        return rows

    def _normalize_workflow_items(
        self, workflow_qs: QuerySet[Workflow], favorite_uuids: set[UUID]
    ) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for workflow in workflow_qs:
            unit = workflow.unit
            rows.append(
                {
                    "object_type": unit.unit_type,
                    "uuid": None,
                    "workflow_uuid": workflow.uuid,
                    "project_uuid": workflow.project.uuid if workflow.project else None,
                    "unit_uuid": unit.uuid,
                    "title": unit.title,
                    "description": unit.description,
                    "date_created": workflow.date_created,
                    "modified_on": workflow.modified_on,
                    "is_template": bool(workflow.project and workflow.project.is_template),
                    "is_favorite": workflow.uuid in favorite_uuids,
                }
            )
        return rows

    def _sort_items(
        self, items: list[dict[str, Any]], *, sort_value: str, sort_direction: str
    ) -> list[dict[str, Any]]:
        reverse = sort_direction != "ASC"

        if sort_value == "A_Z":
            return sorted(items, key=lambda row: row["title"].casefold(), reverse=reverse)
        if sort_value == "DATE_MODIFIED":
            return sorted(items, key=lambda row: row["modified_on"], reverse=reverse)
        return sorted(items, key=lambda row: row["date_created"], reverse=reverse)
