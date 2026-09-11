from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import StrEnum
from uuid import UUID, uuid4

from django.db import transaction
from django.utils import timezone

from course_flow.api.errors import ExpectedApiError
from course_flow.application.services.authorization_service import (
    AuthorizationService,
)
from course_flow.core.enum import WorkspaceResourceType
from course_flow.core.models import (
    Edge,
    Node,
    Project,
    Thread,
    User,
    Workflow,
    WorkspaceEditLock,
)
from course_flow.core.permissions import ResourceRole

EDIT_LOCK_TTL = timedelta(seconds=15)


class WorkspaceEditLockState(StrEnum):
    HELD = "held"
    LOCKED = "locked"
    AVAILABLE = "available"


class WorkspaceReferenceType(StrEnum):
    PROJECT = "project"
    WORKFLOW = "workflow"
    GRAPH = "graph"
    CHANNEL = "channel"
    SECTION = "section"
    NODE = "node"
    OUTCOME = "outcome"
    EDGE = "edge"
    THREAD = "thread"


class WorkspaceResourceNotFound(LookupError):
    pass


class WorkspaceEditLockIneligible(PermissionError):
    pass


@dataclass(frozen=True, slots=True)
class WorkspaceEditLockResult:
    resource_type: WorkspaceResourceType
    resource_uuid: UUID
    state: WorkspaceEditLockState
    holder_uuid: UUID | None = None
    holder_display_name: str | None = None
    version: UUID | None = None
    expires_at: datetime | None = None


WorkspaceResource = Project | Workflow


def _display_name(user: User) -> str:
    return user.get_full_name().strip() or user.email


class WorkspaceEditLockService:
    """Atomic edit-lease lifecycle and mutation-time authorization."""

    def __init__(self) -> None:
        self._authorization = AuthorizationService()

    def _get_resource(
        self,
        resource_type: WorkspaceResourceType,
        resource_uuid: UUID,
        *,
        for_update: bool,
    ) -> WorkspaceResource:
        if resource_type is WorkspaceResourceType.PROJECT:
            rows = Project.objects
        else:
            rows = Workflow.objects.select_related("project")
        if for_update:
            rows = rows.select_for_update(of=("self",))
        try:
            return rows.get(uuid=resource_uuid)
        except (Project.DoesNotExist, Workflow.DoesNotExist) as exc:
            raise WorkspaceResourceNotFound from exc

    def _resource_context(self, resource: WorkspaceResource, user: User):
        if isinstance(resource, Project):
            return self._authorization.permissions_for_project(
                user=user,
                project=resource,
            )
        return self._authorization.permissions_for_workflow(
            user=user,
            workflow=resource,
        )

    def _eligible(self, resource: WorkspaceResource, user: User) -> bool:
        context = self._resource_context(resource, user)
        return (
            context.resource_role in {ResourceRole.OWNER, ResourceRole.EDITOR}
            and context.state.value != "archived"
        )

    def _require_eligible(self, resource: WorkspaceResource, user: User) -> None:
        if not self._eligible(resource, user):
            raise WorkspaceEditLockIneligible

    @staticmethod
    def _lock_query(resource: WorkspaceResource):
        filters = (
            {"project_id": resource.id}
            if isinstance(resource, Project)
            else {"workflow_id": resource.id}
        )
        return WorkspaceEditLock.objects.select_for_update().filter(**filters)

    @staticmethod
    def _resource_identity(
        resource: WorkspaceResource,
    ) -> tuple[WorkspaceResourceType, UUID]:
        if isinstance(resource, Project):
            return WorkspaceResourceType.PROJECT, resource.uuid
        return WorkspaceResourceType.WORKFLOW, resource.uuid

    def _result(
        self,
        resource: WorkspaceResource,
        state: WorkspaceEditLockState,
        lock: WorkspaceEditLock | None = None,
    ) -> WorkspaceEditLockResult:
        resource_type, resource_uuid = self._resource_identity(resource)
        holder = lock.holder if lock is not None else None
        return WorkspaceEditLockResult(
            resource_type=resource_type,
            resource_uuid=resource_uuid,
            state=state,
            holder_uuid=holder.uuid if holder is not None else None,
            holder_display_name=_display_name(holder) if holder is not None else None,
            version=lock.version if lock is not None else None,
            expires_at=lock.expires_at if lock is not None else None,
        )

    def _active_lock(
        self,
        resource: WorkspaceResource,
        now: datetime,
    ) -> WorkspaceEditLock | None:
        lock = self._lock_query(resource).select_related("holder").first()
        return lock if lock is not None and lock.expires_at > now else None

    @transaction.atomic
    def acquire(
        self,
        resource_type: WorkspaceResourceType,
        resource_uuid: UUID,
        user: User,
    ) -> WorkspaceEditLockResult:
        resource = self._get_resource(resource_type, resource_uuid, for_update=True)
        self._require_eligible(resource, user)
        now = timezone.now()
        lock = self._lock_query(resource).select_related("holder").first()
        if lock is not None and lock.expires_at > now and lock.holder_id != user.id:
            return self._result(resource, WorkspaceEditLockState.LOCKED, lock)

        if lock is None:
            lock = WorkspaceEditLock(
                holder=user,
                expires_at=now + EDIT_LOCK_TTL,
                project=resource if isinstance(resource, Project) else None,
                workflow=resource if isinstance(resource, Workflow) else None,
            )
        else:
            if lock.holder_id != user.id or lock.expires_at <= now:
                lock.version = uuid4()
            lock.holder = user
            lock.expires_at = now + EDIT_LOCK_TTL
        lock.save()
        return self._result(resource, WorkspaceEditLockState.HELD, lock)

    def status(
        self,
        resource_type: WorkspaceResourceType,
        resource_uuid: UUID,
        user: User,
    ) -> WorkspaceEditLockResult:
        resource = self._get_resource(resource_type, resource_uuid, for_update=False)
        self._require_eligible(resource, user)
        filters = (
            {"project_id": resource.id}
            if isinstance(resource, Project)
            else {"workflow_id": resource.id}
        )
        lock = (
            WorkspaceEditLock.objects.filter(**filters).select_related("holder").first()
        )
        now = timezone.now()
        if lock is None or lock.expires_at <= now:
            return self._result(resource, WorkspaceEditLockState.AVAILABLE)
        state = (
            WorkspaceEditLockState.HELD
            if lock.holder_id == user.id
            else WorkspaceEditLockState.LOCKED
        )
        return self._result(resource, state, lock)

    @transaction.atomic
    def refresh(
        self,
        resource_type: WorkspaceResourceType,
        resource_uuid: UUID,
        user: User,
    ) -> WorkspaceEditLockResult:
        resource = self._get_resource(resource_type, resource_uuid, for_update=True)
        self._require_eligible(resource, user)
        now = timezone.now()
        lock = self._active_lock(resource, now)
        if lock is None:
            return self._result(resource, WorkspaceEditLockState.AVAILABLE)
        if lock.holder_id != user.id:
            return self._result(resource, WorkspaceEditLockState.LOCKED, lock)
        lock.expires_at = now + EDIT_LOCK_TTL
        lock.save(update_fields=["expires_at", "modified_on"])
        return self._result(resource, WorkspaceEditLockState.HELD, lock)

    @transaction.atomic
    def takeover(
        self,
        resource_type: WorkspaceResourceType,
        resource_uuid: UUID,
        user: User,
        *,
        expected_version: UUID,
    ) -> WorkspaceEditLockResult:
        resource = self._get_resource(resource_type, resource_uuid, for_update=True)
        self._require_eligible(resource, user)
        now = timezone.now()
        lock = self._lock_query(resource).select_related("holder").first()

        if (
            lock is not None
            and lock.expires_at > now
            and lock.holder_id != user.id
            and lock.version != expected_version
        ):
            return self._result(resource, WorkspaceEditLockState.LOCKED, lock)

        if lock is None:
            lock = WorkspaceEditLock(
                holder=user,
                expires_at=now + EDIT_LOCK_TTL,
                project=resource if isinstance(resource, Project) else None,
                workflow=resource if isinstance(resource, Workflow) else None,
            )
        else:
            if lock.holder_id != user.id:
                lock.version = uuid4()
            lock.holder = user
            lock.expires_at = now + EDIT_LOCK_TTL
        lock.save()
        return self._result(resource, WorkspaceEditLockState.HELD, lock)

    def resolve_workspace(
        self,
        reference_type: WorkspaceReferenceType,
        reference: UUID | int,
    ) -> tuple[WorkspaceResourceType, UUID] | None:
        if reference_type is WorkspaceReferenceType.PROJECT:
            return WorkspaceResourceType.PROJECT, UUID(str(reference))
        if reference_type is WorkspaceReferenceType.WORKFLOW:
            return WorkspaceResourceType.WORKFLOW, UUID(str(reference))

        workflow_uuid: UUID | None = None
        if reference_type is WorkspaceReferenceType.GRAPH:
            workflow_uuid = (
                Workflow.objects.filter(graph__uuid=reference)
                .values_list("uuid", flat=True)
                .first()
            )
        elif reference_type is WorkspaceReferenceType.CHANNEL:
            workflow_uuid = (
                Workflow.objects.filter(graph__channels__uuid=reference)
                .values_list("uuid", flat=True)
                .first()
            )
        elif reference_type is WorkspaceReferenceType.SECTION:
            workflow_uuid = (
                Workflow.objects.filter(graph__sections__uuid=reference)
                .values_list("uuid", flat=True)
                .first()
            )
        elif reference_type is WorkspaceReferenceType.NODE:
            workflow_uuid = (
                Node.objects.filter(uuid=reference)
                .values_list("workflow__uuid", flat=True)
                .first()
            )
        elif reference_type is WorkspaceReferenceType.OUTCOME:
            workflow_uuid = (
                Workflow.objects.filter(graph__outcomes__uuid=reference)
                .values_list("uuid", flat=True)
                .first()
            )
        elif reference_type is WorkspaceReferenceType.EDGE:
            workflow_uuid = (
                Edge.objects.filter(pk=reference)
                .values_list("source_node__workflow__uuid", flat=True)
                .first()
            )
        elif reference_type is WorkspaceReferenceType.THREAD:
            thread = Thread.objects.filter(uuid=reference).first()
            if thread is not None:
                if hasattr(thread, "node"):
                    workflow_uuid = thread.node.workflow.uuid
                elif hasattr(thread, "section"):
                    workflow_uuid = thread.section.graph.workflow.uuid
                elif hasattr(thread, "channel"):
                    workflow_uuid = thread.channel.graph.workflow.uuid
                elif hasattr(thread, "outcome"):
                    workflow_uuid = thread.outcome.graph.workflow.uuid

        if workflow_uuid is None:
            return None
        return WorkspaceResourceType.WORKFLOW, workflow_uuid

    def require_for_mutation(
        self,
        user: User,
        reference_type: WorkspaceReferenceType,
        reference: UUID | int,
    ) -> None:
        resolved = self.resolve_workspace(reference_type, reference)
        if resolved is None:
            return
        resource_type, resource_uuid = resolved
        try:
            resource = self._get_resource(
                resource_type,
                resource_uuid,
                for_update=True,
            )
        except WorkspaceResourceNotFound:
            # Preserve the endpoint's established not-found response and avoid
            # manufacturing an edit-lock error for a resource that cannot mutate.
            return

        # Commenters/viewers/public actors do not participate in edit leases. Their
        # endpoint-specific permission checks still decide whether the mutation is legal.
        if not self._eligible(resource, user):
            return

        now = timezone.now()
        lock = self._active_lock(resource, now)
        if lock is None:
            raise ExpectedApiError(
                409,
                "edit_lock_expired",
                params={
                    "workspace": resource_type.value,
                    "resourceUuid": str(resource_uuid),
                },
            )
        if lock.holder_id != user.id:
            raise ExpectedApiError(
                409,
                "workspace_edit_lock_conflict",
                params={
                    "workspace": resource_type.value,
                    "resourceUuid": str(resource_uuid),
                    "holderDisplayName": _display_name(lock.holder),
                    "holderUuid": str(lock.holder.uuid),
                    "version": str(lock.version),
                },
            )
