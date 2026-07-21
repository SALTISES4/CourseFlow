from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import get_library_service
from course_flow.api.schemas.library import (
    LibraryFavoriteIn,
    LibraryFavoriteOut,
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
        payload=payload,
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

    try:
        return svc.toggle_favorite(
            user_id=user.id,
            uuid=payload.uuid,
        )
    except PermissionError as exc:
        raise HttpError(403, "Forbidden") from exc
    except ValueError as exc:
        raise HttpError(404, "Library item not found") from exc
