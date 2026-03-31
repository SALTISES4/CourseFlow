from ninja import Router

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import get_library_service
from course_flow_v2.api.schemas.library import (
    LibrarySearchIn,
    LibrarySearchOut,
)

router = Router(tags=["library"])


@router.post("/search", response=LibrarySearchOut, auth=BearerAuth())
def search_library(request, payload: LibrarySearchIn):
    current_user = get_current_user(request)
    svc = get_library_service()
    return svc.search(
        user_id=current_user.id,
        payload=payload.model_dump(exclude_none=True, mode="json"),
    )
