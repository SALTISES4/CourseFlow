from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum
from typing import Any
from uuid import UUID

from django.db.models import Count, Q, QuerySet

from course_flow.api.schemas.library import (
    LibraryAllowedFiltersOut,
    LibraryAppliedFiltersOut,
    LibraryContentTypeIn,
    LibraryContentTypeOut,
    LibraryDisciplineOptionOut,
    LibraryFavoriteOut,
    LibraryFiltersIn,
    LibraryItemOut,
    LibrarySearchIn,
    LibrarySearchOut,
    LibrarySortDirectionIn,
    LibrarySortValueIn,
)
from course_flow.application.services.authorization_service import (
    AuthorizationService,
    PermissionContext,
)
from course_flow.core.enum import TeamRole
from course_flow.core.models import (
    Discipline,
    FavoriteGraph,
    FavoriteProject,
    Graph,
    Project,
    User,
    Workflow,
)
from course_flow.core.permissions import ProjectPermission, WorkflowPermission


class LibraryObjectType(str, Enum):
    PROJECT = "project"
    WORKFLOW = "workflow"

@dataclass(frozen=True, slots=True)
class LibraryObject:
    id: int
    type: LibraryObjectType
    uuid: UUID
    resource: Project | Workflow

class LibraryService:
    def __init__(self) -> None:
        self._authorization = AuthorizationService()

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
        sort_value = (sort.value if sort else LibrarySortValueIn.DATE_MODIFIED).upper()
        sort_direction = (sort.direction if sort else LibrarySortDirectionIn.DESC).upper()

        keyword = self._normalize_keyword(raw_filters.keyword)

        filters = LibraryAppliedFiltersOut(
            keyword=keyword,
            content_type=raw_filters.content_type,
            project_uuid=raw_filters.project_uuid,
            discipline_codes=list(raw_filters.discipline_codes or []),
            workflow_types=list(raw_filters.workflow_types or []),
            ownership=raw_filters.ownership,
            is_archived=raw_filters.is_archived,
            is_favorite=raw_filters.is_favorite,
            include_published_favorites=raw_filters.include_published_favorites,
            is_template=raw_filters.is_template,
            can_create_workflow=raw_filters.can_create_workflow,
        )

        contributor_projects = Project.objects.filter(
            Q(owner_id=user_id) | Q(team__users__user_id=user_id)
        ).distinct()

        project_qs = contributor_projects
        workflow_graph_qs = Graph.objects.select_related(
            "workflow",
            "workflow__author",
            "workflow__project",
            "workflow__project__owner",
        ).filter(
            workflow__project_id__in=contributor_projects.values("id"),
        )

        if filters.include_published_favorites:
            project_qs = Project.objects.filter(
                Q(id__in=contributor_projects.values("id"))
                | Q(is_published=True, favorite_links__user_id=user_id)
            ).distinct()
            workflow_graph_qs = Graph.objects.select_related(
                "workflow",
                "workflow__author",
                "workflow__project",
                "workflow__project__owner",
            ).filter(
                Q(workflow__project_id__in=contributor_projects.values("id"))
                | Q(
                    workflow__project__is_published=True,
                    favorite_links__user_id=user_id,
                )
            ).distinct()

        if filters.ownership == "owned":
            project_qs = project_qs.filter(owner_id=user_id)
            workflow_graph_qs = workflow_graph_qs.filter(
                Q(workflow__author_id=user_id)
                | Q(workflow__project__owner_id=user_id)
            )

        elif filters.ownership == "shared":
            project_qs = project_qs.filter(
                team__users__user_id=user_id,
            ).exclude(owner_id=user_id).distinct()
            workflow_graph_qs = workflow_graph_qs.filter(
                workflow__project__team__users__user_id=user_id,
            ).exclude(
                workflow__author_id=user_id,
            ).exclude(
                workflow__project__owner_id=user_id,
            ).distinct()

        if filters.can_create_workflow:
            project_qs = project_qs.filter(
                Q(owner_id=user_id)
                | Q(
                    team__users__user_id=user_id,
                    team__users__role=TeamRole.EDITOR,
                )
            ).distinct()

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
            workflow_graph_qs = workflow_graph_qs.filter(
                workflow__project__uuid=filters.project_uuid
            )

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

        if filters.is_archived:
            project_qs = project_qs.filter(is_archived=True)
            workflow_graph_qs = workflow_graph_qs.filter(
                Q(workflow__is_archived=True)
                | Q(workflow__project__is_archived=True)
            )
        else:
            project_qs = project_qs.filter(is_archived=False)
            workflow_graph_qs = workflow_graph_qs.filter(
                workflow__is_archived=False,
                workflow__project__is_archived=False,
            )

        # Availability excludes the discipline constraint itself so selecting one
        # discipline does not incorrectly disable other OR-selectable options.
        allowed_discipline_codes = {
            discipline_code
            for discipline_code in (
                *project_qs.values_list("disciplines__code", flat=True),
                *workflow_graph_qs.values_list(
                    "workflow__project__disciplines__code", flat=True
                ),
            )
            if discipline_code is not None
        }

        if filters.discipline_codes:
            project_qs = project_qs.filter(
                disciplines__code__in=filters.discipline_codes
            ).distinct()
            workflow_graph_qs = workflow_graph_qs.filter(
                workflow__project__disciplines__code__in=filters.discipline_codes
            ).distinct()

        project_qs = project_qs.select_related("owner").annotate(
            library_workflow_count=Count("workflows", distinct=True)
        )

        project_favorite_uuids = self._favorite_project_uuids(
            user_id=user_id, project_qs=project_qs
        )

        graph_favorite_uuids = self._favorite_graph_uuids(
            user_id=user_id,
            graph_qs=workflow_graph_qs,
        )

        user = User.objects.get(pk=user_id)
        items = self._normalize_project_items(
            user,
            project_qs,
            project_favorite_uuids,
        )
        items.extend(
            self._normalize_workflow_items(
                user,
                workflow_graph_qs,
                graph_favorite_uuids,
            )
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

        res = {
            "items": items[start_idx:end_idx],
            "meta": {
                "total_results": total_results,
                "page_count": page_count,
                "current_page": page,
                "results_per_page": results_per_page,
                "applied_filters": filters.model_dump(mode="json"),
                "allowed": LibraryAllowedFiltersOut(
                    disciplines=self._discipline_options(allowed_discipline_codes)
                ).model_dump(mode="json"),
            },
        }

        return LibrarySearchOut.model_validate(res)

    def toggle_favorite(self, *, user_id: int, uuid: UUID):
        library_item = self._find_from_uuid(uuid)
        user = User.objects.get(pk=user_id)
        if library_item.type is LibraryObjectType.PROJECT:
            allowed = self._authorization.permissions_for_project(
                user=user,
                project=library_item.resource,
            ).allows(ProjectPermission.VIEW)
        else:
            allowed = self._authorization.permissions_for_workflow(
                user=user,
                workflow=library_item.resource,
            ).allows(WorkflowPermission.VIEW)
        if not allowed:
            raise PermissionError

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

        workflow = (
            Workflow.objects.select_related("graph", "project")
            .filter(uuid=uuid)
            .first()
        )
        if workflow:
            return LibraryObject(
                id=workflow.graph_id,
                type=LibraryObjectType.WORKFLOW,
                uuid=workflow.uuid,
                resource=workflow,
            )

        project = Project.objects.filter(uuid=uuid).first()
        if project:
            return LibraryObject(
                id=project.id,
                type=LibraryObjectType.PROJECT,
                uuid=project.uuid,
                resource=project,
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
        self,
        user: User,
        project_qs: QuerySet[Project],
        favorite_uuids: set[UUID],
    ) -> list[LibraryItemOut]:
        rows: list[LibraryItemOut] = []
        for project in project_qs:
            rows.append(
                LibraryItemOut(
                    uuid=project.uuid,
                    content_type=LibraryContentTypeOut.PROJECT,
                    label="project",
                    title=project.title,
                    description=project.description,
                    owner_name=self._owner_name(project.owner),
                    workflow_count=getattr(project, "library_workflow_count", 0),
                    date_created=project.date_created,
                    modified_on=project.modified_on,
                    is_archived=project.is_archived,
                    is_template=project.is_template,
                    is_favorite=project.uuid in favorite_uuids,
                    project_uuid=None,
                    project_is_archived=None,
                    permissions=self._permission_payload(
                        self._authorization.permissions_for_project(
                            user=user,
                            project=project,
                        )
                    ),
                )
            )
        return rows

    def _normalize_workflow_items(
        self,
        user: User,
        workflow_graph_qs: QuerySet[Graph],
        favorite_uuids: set[UUID],
    ) -> list[LibraryItemOut]:
        rows: list[LibraryItemOut] = []
        for graph in workflow_graph_qs:
            workflow = graph.workflow
            proj = workflow.project
            rows.append(
                LibraryItemOut(
                    content_type=LibraryContentTypeOut.WORKFLOW,
                    label=workflow.workflow_type,
                    uuid=workflow.uuid,
                    title=workflow.title,
                    description=workflow.description,
                    owner_name=self._owner_name(workflow.author or proj.owner),
                    workflow_count=None,
                    date_created=graph.date_created,
                    modified_on=graph.modified_on,
                    is_archived=workflow.is_archived or proj.is_archived,
                    is_template=proj.is_template,
                    is_favorite=graph.uuid in favorite_uuids,
                    project_uuid=proj.uuid,
                    project_is_archived=proj.is_archived,
                    permissions=self._permission_payload(
                        self._authorization.permissions_for_workflow(
                            user=user,
                            workflow=workflow,
                        )
                    ),
                )
            )
        return rows

    @staticmethod
    def _owner_name(owner: User | None) -> str | None:
        if owner is None:
            return None
        full_name = owner.get_full_name().strip()
        return full_name or owner.email

    def _permission_payload(self, context: PermissionContext) -> dict[str, Any]:
        return {
            "account_role": context.account_role,
            "resource_role": context.resource_role,
            "state": context.state.value,
            "actions": sorted(context.actions),
            "admin_override": context.admin_override,
        }

    def _discipline_options(
        self, allowed_discipline_codes: set[str]
    ) -> list[dict[str, Any]]:
        return [
            LibraryDisciplineOptionOut(
                code=discipline.code,
            )
            for discipline in Discipline.objects.filter(
                code__in=allowed_discipline_codes
            ).order_by("code")
        ]

    def _sort_items(
        self, items: list[LibraryItemOut], *, sort_value: str, sort_direction: str
    ) -> list[LibraryItemOut]:
        reverse = sort_direction != "ASC"

        if sort_value == "A_Z":
            return sorted(
                items, key=lambda row: row.title.casefold(), reverse=reverse
            )
        if sort_value == "DATE_MODIFIED":
            return sorted(items, key=lambda row: row.modified_on, reverse=reverse)
        return sorted(items, key=lambda row: row.date_created, reverse=reverse)
