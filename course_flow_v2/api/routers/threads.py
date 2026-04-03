from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.common.schemas import SuccessOut
from course_flow_v2.api.deps import get_thread_comment_service
from course_flow_v2.api.schemas.comments import (
    CommentAuthorOut,
    CommentCreateIn,
    CommentOut,
    ThreadCommentsBulkDeleteOut,
)
from course_flow_v2.application.dto import CommentDTO

router = Router(tags=["threads"], by_alias=True)


def _comment_to_out(dto: CommentDTO) -> CommentOut:
    return CommentOut(
        uuid=dto.uuid,
        thread_uuid=dto.thread_uuid,
        body=dto.body,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
        author=CommentAuthorOut(
            uuid=dto.author.uuid,
            email=dto.author.email,
            first_name=dto.author.first_name,
            last_name=dto.author.last_name,
        ),
    )


@router.get(
    "/{uuid}/comments",
    response=list[CommentOut],
    auth=BearerAuth(),
    operation_id="listThreadComments",
)
def list_thread_comments(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_thread_comment_service()
    try:
        rows = svc.list_comments_for_user(uuid, current_user.id)
    except PermissionError:
        raise HttpError(403, "Forbidden")
    if rows is None:
        raise HttpError(404, "Thread not found")
    return [_comment_to_out(r) for r in rows]


@router.post(
    "/{uuid}/comments",
    response=CommentOut,
    auth=BearerAuth(),
    operation_id="createThreadComment",
)
def create_thread_comment(request, uuid: UUID, payload: CommentCreateIn):
    current_user = get_current_user(request)
    svc = get_thread_comment_service()
    try:
        dto = svc.create_comment(uuid, current_user.id, payload.body)
    except ValueError as exc:
        raise HttpError(400, str(exc))
    except PermissionError:
        raise HttpError(403, "Forbidden")
    if dto is None:
        raise HttpError(404, "Thread not found")
    return _comment_to_out(dto)


@router.delete(
    "/{uuid}/comments/{comment_uuid}",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="deleteThreadComment",
)
def delete_thread_comment(request, uuid: UUID, comment_uuid: UUID):
    current_user = get_current_user(request)
    svc = get_thread_comment_service()
    try:
        result = svc.delete_comment(uuid, comment_uuid, current_user.id)
    except PermissionError:
        raise HttpError(403, "Forbidden")
    if result == "not_found":
        raise HttpError(404, "Thread not found")
    if result in ("comment_not_found", "wrong_thread"):
        raise HttpError(404, "Comment not found")
    return SuccessOut()


@router.delete(
    "/{uuid}/comments",
    response=ThreadCommentsBulkDeleteOut,
    auth=BearerAuth(),
    operation_id="deleteAllThreadComments",
)
def delete_all_thread_comments(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_thread_comment_service()
    try:
        count = svc.delete_all_comments(uuid, current_user.id)
    except PermissionError:
        raise HttpError(403, "Forbidden")
    if count is None:
        raise HttpError(404, "Thread not found")
    return ThreadCommentsBulkDeleteOut(success=True, deleted_count=count)
