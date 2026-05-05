from ninja import Router

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import get_library_service
from course_flow_v2.api.schemas.library import (
    LibraryFavoriteOut,
    LibraryFavoriteIn,
    LibrarySearchIn,
    LibrarySearchOut,
)

router = Router(tags=["library"], by_alias=True)


@router.post(
    "/search",
    response=LibrarySearchOut,
    auth=BearerAuth(),
    operation_id="searchLibrary",
)

def search_library(request, payload: LibrarySearchIn):
    current_user = get_current_user(request)
    svc = get_library_service()
    return svc.search(
        user_id=current_user.id,
        payload=payload.model_dump(exclude_none=True, mode="json"),
    )


@router.post(
    "/favorite",
    response=LibraryFavoriteOut,
    auth=BearerAuth(),
    operation_id="libraryItemFavoriteToggle",
)

def library_item_favorite_toggle(request, payload: LibraryFavoriteIn):
    user = get_current_user(request)
    svc = get_library_service()

    return svc.toggle_favorite(
        user_id=user.id,
        uuid=payload.uuid,
        target_type=payload.target_type,
    )
