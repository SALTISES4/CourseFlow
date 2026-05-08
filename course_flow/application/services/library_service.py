from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum
from typing import Any
from uuid import UUID

from django.db.models import Q, QuerySet

from course_flow.api.schemas.library import (
    LibraryAllowedFiltersOut,
    LibraryAppliedFiltersOut,
    LibraryContentTypeIn,
    LibraryFavoriteOut,
    LibraryFiltersIn,
    LibrarySearchIn,
    LibrarySearchOut,
)
from course_flow.core.models import (
    Discipline,
    FavoriteGraph,
    FavoriteProject,
    Graph,
    Project,
    Workflow,
)


class LibraryObjectType(str, Enum):
    PROJECT = "project"
    WORKFLOW = "workflow"

@dataclass(frozen=True, slots=True)
class LibraryObject:
    id: int
    type: LibraryObjectType
    uuid: UUID

class LibraryService:
    def search(
        self,
        *,
        user_id: int,
        payload: LibrarySearchIn,
    ) -> LibrarySearchOut:

        #########################################################
        # META / PAGINATION
        #########################################################
        pagination = payload.pagination
        sort = payload.sort
        raw_filters = payload.filters or LibraryFiltersIn()

        page = max(int((pagination.page if pagination else 0) or 0), 0)
        results_per_page = max(int((pagination.results_per_page if pagination else 10) or 10), 1)
        sort_value = ((sort.value if sort else "DATE_CREATED") or "DATE_CREATED").upper()
        sort_direction = ((sort.direction if sort else "DESC") or "DESC").upper()

        keyword = self._normalize_keyword(raw_filters.keyword)

        filters = LibraryAppliedFiltersOut(
            keyword=keyword,
            content_type=raw_filters.content_type,
            project_uuid=raw_filters.project_uuid,
            discipline_ids=list(raw_filters.discipline_ids or []),
            workflow_types=list(raw_filters.workflow_types or []),
            ownership=raw_filters.ownership,
            is_favorite=raw_filters.is_favorite,
            is_template=raw_filters.is_template,
        )

        accessible_projects = Project.objects.filter(
            Q(owner_id=user_id) | Q(team__users__user_id=user_id)
        ).distinct()

        if filters.ownership == "owned":
            accessible_projects = accessible_projects.filter(owner_id=user_id)

        elif filters.ownership == "shared":
            accessible_projects = accessible_projects.exclude(owner_id=user_id)

        project_qs = accessible_projects
        workflow_graph_qs = Graph.objects.select_related("workflow", "workflow__project").filter(
            workflow__project_id__in=accessible_projects.values("id"),
        )

        #########################################################
        # CONTENT TYPE
        #########################################################
        if filters.content_type == LibraryContentTypeIn.PROJECT:
            workflow_graph_qs = workflow_graph_qs.none()

        elif filters.content_type == LibraryContentTypeIn.WORKFLOW:
            project_qs = project_qs.none()

        if filters.workflow_types:
            project_qs = project_qs.none()
            workflow_graph_qs = workflow_graph_qs.filter(
                workflow__workflow_type__in=filters.workflow_types
            )

        if filters.project_uuid is not None:
            # Scope means "library items under this project": workflows only, not the project row itself.
            project_qs = project_qs.none()
            scoped_project = accessible_projects.filter(
                uuid=filters.project_uuid
            ).only("id").first()
            if scoped_project is None:
                workflow_graph_qs = workflow_graph_qs.none()
            else:
                workflow_graph_qs = workflow_graph_qs.filter(
                    workflow__project_id=scoped_project.id
                )

        if filters.discipline_ids:
            project_qs = project_qs.filter(
                disciplines__id__in=filters.discipline_ids
            ).distinct()
            workflow_graph_qs = workflow_graph_qs.filter(
                workflow__project__disciplines__id__in=filters.discipline_ids
            ).distinct()

        # Boolean filters are "only when true":
        # False/None means the filter is not applied.
        if filters.is_template:
            project_qs = project_qs.filter(is_template=True)
            workflow_graph_qs = workflow_graph_qs.filter(workflow__project__is_template=True)

        if keyword:
            project_qs = project_qs.filter(
                Q(title__icontains=keyword) | Q(description__icontains=keyword)
            )
            workflow_graph_qs = workflow_graph_qs.filter(
                Q(workflow__title__icontains=keyword)
                | Q(workflow__description__icontains=keyword)
            )

        # Boolean filters are "only when true":
        # False/None means the filter is not applied.
        if filters.is_favorite:
            project_qs = project_qs.filter(favorite_links__user_id=user_id)
            workflow_graph_qs = workflow_graph_qs.filter(favorite_links__user_id=user_id)

        project_favorite_uuids = self._favorite_project_uuids(
            user_id=user_id, project_qs=project_qs
        )

        graph_favorite_uuids = self._favorite_graph_uuids(
            user_id=user_id,
            graph_qs=workflow_graph_qs,
        )

        items = self._normalize_project_items(project_qs, project_favorite_uuids)
        items.extend(
            self._normalize_workflow_items(workflow_graph_qs, graph_favorite_uuids)
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

        res =  {
            "items": items[start_idx:end_idx],
            "meta": {
                "total_results": total_results,
                "page_count": page_count,
                "current_page": page,
                "results_per_page": results_per_page,
                "applied_filters": filters.model_dump(mode="json"),
                "allowed": LibraryAllowedFiltersOut(
                    disciplines=self._discipline_options()
                ).model_dump(mode="json"),
            },
        }

        return LibrarySearchOut.model_validate(res)

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

    def _find_from_uuid(self, uuid: UUID | None):
        if uuid is None:
            raise ValueError("UUID is required")

        workflow = Workflow.objects.filter(uuid=uuid).only("id", "uuid", "graph_id").first()
        if workflow:
            return LibraryObject(
                id=workflow.graph_id,
                type=LibraryObjectType.WORKFLOW,
                uuid=workflow.uuid,
            )

        project = Project.objects.filter(uuid=uuid).only("id", "uuid").first()
        if project:
            return LibraryObject(
                id=project.id,
                type=LibraryObjectType.PROJECT,
                uuid=project.uuid,
            )

        raise ValueError(f"Couldn't find UUID: {uuid}")

    def _normalize_keyword(self, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

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
                    "content_type": "project",
                    "label": "project",
                    "uuid": project.uuid,
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
        self, workflow_graph_qs: QuerySet[Graph], favorite_uuids: set[UUID]
    ) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for graph in workflow_graph_qs:
            workflow = graph.workflow
            proj = workflow.project
            rows.append(
                {
                    "content_type": "workflow",
                    "label": workflow.workflow_type,
                    "uuid": workflow.uuid,
                    "title": workflow.title,
                    "description": workflow.description,
                    "date_created": graph.date_created,
                    "modified_on": graph.modified_on,
                    "is_template": bool(proj and proj.is_template),
                    "is_favorite": graph.uuid in favorite_uuids,
                }
            )
        return rows

    def _discipline_options(self) -> list[dict[str, Any]]:
        return [
            {
                "id": discipline.id,
                "label": discipline.label,
                "translation_plural": discipline.translation_plural,
            }
            for discipline in Discipline.objects.all().order_by("label", "id")
        ]

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
