import {
  LibraryObjectsSearchQueryArgs,
  ToggleFavouriteQueryArgs
} from '@XMLHTTP/types/args'
import { API_GET, API_POST } from '@XMLHTTP/CallWrapper'
import {
  EmptyPostResp,
  LibraryObjectsSearchQueryResp
} from '@XMLHTTP/types/query'

/**
 * Search entire library
 *
 * @param filter
 * @param data
 * @param callBackFunction
 */
export function libraryObjectsSearchQuery(
  args: LibraryObjectsSearchQueryArgs
): Promise<LibraryObjectsSearchQueryResp> {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.library
      .library__objects_search
  return API_POST(url, {
    args
  })
}
/**
 * Get the library projects
 * @param callBackFunction
 * this uses a callback because not yet used in hook
 */
export function libraryFavouriteObjectsQuery(
  args: LibraryObjectsSearchQueryArgs
): Promise<LibraryObjectsSearchQueryResp> {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.library
      .library__favourites__projects

  return API_POST<LibraryObjectsSearchQueryResp>(url, { args })
}

/*******************************************************
 *
 *******************************************************/
export function toggleFavouriteMutation({
  id,
  type,
  favourite
}: ToggleFavouriteQueryArgs): Promise<EmptyPostResp> {
  return API_POST<EmptyPostResp>(
    COURSEFLOW_APP.globalContextData.path.post_paths.toggle_favourite,
    {
      objectID: id,
      objectType: type,
      favourite: favourite
    }
  )
}
