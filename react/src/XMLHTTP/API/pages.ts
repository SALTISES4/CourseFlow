import {
  PageExploreQueryResp,
  FavouritesQueryResp,
  PageHomeQueryResp,
  LibraryQueryResp,
  LibraryObjectsSearchQueryResp,
  DisciplineQueryResp
} from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { API_GET, API_POST } from '@XMLHTTP/CallWrapper'
import { EDiscipline } from '@XMLHTTP/types/entity'

/*******************************************************
 * HOME PAGE
 *******************************************************/
export async function fetchHomeContext(): Promise<PageHomeQueryResp> {
  const url = COURSEFLOW_APP.globalContextData.path.json_api.library.home
  return API_GET<PageHomeQueryResp>(url)
}

/*******************************************************
 * LIBRARY PAGES
 *******************************************************/

export async function fetchExploreContext(): Promise<PageExploreQueryResp> {
  const url = COURSEFLOW_APP.globalContextData.path.json_api.library.explore
  return API_GET<PageExploreQueryResp>(url)
}

/**
 * Search entire library
 *
 * @param filter
 * @param data
 * @param callBackFunction
 */
export function libraryObjectsSearchQuery(
  filter,
  data,
  callBackFunction = (_data: LibraryObjectsSearchQueryResp) =>
    console.log('success')
) {
  API_POST(
    COURSEFLOW_APP.globalContextData.path.json_api.library
      .library__objects_search,
    {
      filter: filter,
      additional_data: data
    }
  ).then((response: LibraryObjectsSearchQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

/**
 * Get the library projects
 * @param callBackFunction
 * this uses a callback because not yet used in hook
 */
export const getLibraryQuery = (
  callBackFunction = (_data: LibraryQueryResp) => console.log('success')
) => {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.library
      .library__library__projects

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
export const getFavouritesQuery = (
  callBackFunction = (_data: FavouritesQueryResp) => console.log('success')
) => {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.library
      .library__favourites__projects

  API_GET<FavouritesQueryResp>(url)
    .then((response) => {
      callBackFunction(response)
    })
    .catch((error) => {
      console.error('Error fetching library data:', error)
      window.fail_function()
    })
}
