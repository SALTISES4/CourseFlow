import {
  PageExploreQueryResp,
  FavouritesQueryResp,
  PageHomeQueryResp,
  LibraryQueryResp,
  SearchAllObjectsQueryResp
} from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { ToDefine } from '@cfModule/types/common'
import { API_GET, API_POST } from '@XMLHTTP/CallWrapper'

/*******************************************************
 * HOME PAGE
 *******************************************************/
export async function fetchHomeContext(): Promise<PageHomeQueryResp> {
  const url = COURSEFLOW_APP.path.json_api.library.home
  return API_GET<PageHomeQueryResp>(url)
}

/*******************************************************
 * LIBRARY PAGES
 *******************************************************/

export async function fetchExploreContext(): Promise<PageExploreQueryResp> {
  const url = COURSEFLOW_APP.path.json_api.library.explore
  return API_GET<PageExploreQueryResp>(url)
}

/**
 *  Toggle whether a project or activity is a favourite for the user
 * @param objectID
 * @param objectType
 * @param favourite
 * @param callBackFunction
 */
export function toggleFavourite(
  objectID,
  objectType,
  favourite,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    API_POST(COURSEFLOW_APP.path.post_paths.toggle_favourite, {
      objectID: objectID,
      objectType: objectType,
      favourite: favourite
    }).then((response: ToDefine) => {
      if (response.action == VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Search entire library
 *
 * @param filter
 * @param data
 * @param callBackFunction
 */
export function searchAllObjectsQuery(
  filter,
  data,
  callBackFunction = (_data: SearchAllObjectsQueryResp) =>
    console.log('success')
) {
  try {
    API_POST(COURSEFLOW_APP.path.json_api.library.library__objects_search, {
      filter: filter,
      additional_data: data
    }).then((response: SearchAllObjectsQueryResp) => {
      if (response.action == VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Get the library projects
 * @param callBackFunction
 * this uses a callback because not yet used in hook
 */
export function getLibraryQuery(
  callBackFunction = (_data: LibraryQueryResp) => console.log('success')
) {
  const url = COURSEFLOW_APP.path.get_paths.get_library

  API_GET<LibraryQueryResp>(url)
    .then((response) => {
      callBackFunction(response)
    })
    .catch((error) => {
      console.error('Error fetching library data:', error)
      window.fail_function()
    })
}

/**
 * Get the library projects
 * @param callBackFunction
 * this uses a callback because not yet used in hook
 */
export function getFavouritesQuery(
  callBackFunction = (_data: FavouritesQueryResp) => console.log('success')
) {
  const url = COURSEFLOW_APP.path.get_paths.get_favourites

  API_GET<FavouritesQueryResp>(url)
    .then((response) => {
      // This assumes the API_GET resolves with the expected response directly
      callBackFunction(response)
    })
    .catch((error) => {
      console.error('Error fetching library data:', error)
      window.fail_function() // Assuming this is your error handling function
    })
}
