from __future__ import annotations

import inspect
from functools import wraps
from typing import Callable, ParamSpec, TypeVar, cast, get_type_hints
from uuid import UUID

from django.db import transaction
from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.schemas.workspace_edit_locks import (
    WorkspaceEditLockHolderOut,
    WorkspaceEditLockOut,
    WorkspaceEditLockTakeoverIn,
)
from course_flow.application.services.workspace_edit_lock_service import (
    WorkspaceEditLockIneligible,
    WorkspaceEditLockResult,
    WorkspaceEditLockService,
    WorkspaceReferenceType,
    WorkspaceResourceNotFound,
)
from course_flow.core.enum import WorkspaceResourceType

router = Router(tags=["workspace-edit-locks"], by_alias=True)
service = WorkspaceEditLockService()

P = ParamSpec("P")
R = TypeVar("R")


def _out(result: WorkspaceEditLockResult) -> WorkspaceEditLockOut:
    holder = None
    if result.holder_uuid is not None and result.holder_display_name is not None:
        holder = WorkspaceEditLockHolderOut(
            uuid=result.holder_uuid,
            display_name=result.holder_display_name,
        )
    return WorkspaceEditLockOut(
        resource_type=result.resource_type,
        resource_uuid=result.resource_uuid,
        state=result.state,
        holder=holder,
        version=result.version,
        expires_at=result.expires_at,
    )


def _run(operation: Callable[[], WorkspaceEditLockResult]) -> WorkspaceEditLockOut:
    try:
        return _out(operation())
    except WorkspaceResourceNotFound as exc:
        raise HttpError(404, "Workspace not found") from exc
    except WorkspaceEditLockIneligible as exc:
        raise HttpError(403, "Forbidden") from exc


@router.post(
    "/{resource_type}/{resource_uuid}/acquire",
    response=WorkspaceEditLockOut,
    auth=BearerAuth(),
    operation_id="acquireWorkspaceEditLock",
)
def acquire_workspace_edit_lock(
    request,
    resource_type: WorkspaceResourceType,
    resource_uuid: UUID,
):
    user = get_current_user(request)
    return _run(lambda: service.acquire(resource_type, resource_uuid, user))


@router.get(
    "/{resource_type}/{resource_uuid}",
    response=WorkspaceEditLockOut,
    auth=BearerAuth(),
    operation_id="getWorkspaceEditLock",
)
def get_workspace_edit_lock(
    request,
    resource_type: WorkspaceResourceType,
    resource_uuid: UUID,
):
    user = get_current_user(request)
    return _run(lambda: service.status(resource_type, resource_uuid, user))


@router.post(
    "/{resource_type}/{resource_uuid}/refresh",
    response=WorkspaceEditLockOut,
    auth=BearerAuth(),
    operation_id="refreshWorkspaceEditLock",
)
def refresh_workspace_edit_lock(
    request,
    resource_type: WorkspaceResourceType,
    resource_uuid: UUID,
):
    user = get_current_user(request)
    return _run(lambda: service.refresh(resource_type, resource_uuid, user))


@router.post(
    "/{resource_type}/{resource_uuid}/takeover",
    response=WorkspaceEditLockOut,
    auth=BearerAuth(),
    operation_id="takeoverWorkspaceEditLock",
)
def takeover_workspace_edit_lock(
    request,
    resource_type: WorkspaceResourceType,
    resource_uuid: UUID,
    payload: WorkspaceEditLockTakeoverIn,
):
    user = get_current_user(request)
    return _run(
        lambda: service.takeover(
            resource_type,
            resource_uuid,
            user,
            expected_version=payload.expected_version,
        )
    )


def workspace_mutation_lock(
    reference_type: WorkspaceReferenceType,
    *,
    lookup_arg: str = "uuid",
    lookup_attr: str | None = None,
):
    """Serialize a protected endpoint with its current workspace lease."""

    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        signature = inspect.signature(func)
        type_hints = get_type_hints(func)
        signature = signature.replace(
            parameters=[
                parameter.replace(
                    annotation=type_hints.get(name, parameter.annotation)
                )
                for name, parameter in signature.parameters.items()
            ],
            return_annotation=type_hints.get("return", signature.return_annotation),
        )

        @wraps(func)
        @transaction.atomic
        def wrapped(*args: P.args, **kwargs: P.kwargs) -> R:
            bound = signature.bind(*args, **kwargs)
            request = bound.arguments["request"]
            reference = bound.arguments[lookup_arg]
            if lookup_attr is not None:
                reference = getattr(reference, lookup_attr)
            if reference is not None:
                service.require_for_mutation(
                    get_current_user(request),
                    reference_type,
                    reference,
                )
            return func(*args, **kwargs)

        wrapped.__signature__ = signature  # type: ignore[attr-defined]
        return cast(Callable[P, R], wrapped)

    return decorator
