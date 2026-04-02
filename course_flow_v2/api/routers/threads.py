from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import get_thread_comment_service
from course_flow_v2.api.schemas.comments import CommentAuthorOut, CommentOut
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
