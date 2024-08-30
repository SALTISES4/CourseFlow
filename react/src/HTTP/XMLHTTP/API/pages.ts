import {
  PageExploreQueryResp,
  FavouritesQueryResp,
  PageHomeQueryResp,
  PageLibraryQueryResp,
  LibraryObjectsSearchQueryResp
} from '@XMLHTTP/types/query'
import { API_GET, API_POST } from '@XMLHTTP/CallWrapper'
import { Filters } from '@cfPages/Library/components/types'

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
 * Get the library projects
 * @param callBackFunction
 * this uses a callback because not yet used in hook
 */
export async function fetchLibraryContext(): Promise<PageLibraryQueryResp> {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.library
      .library__library__projects

  return API_GET<PageLibraryQueryResp>(url)
}

/**
 * Search entire library
 *
 * @param filter
 * @param data
 * @param callBackFunction
 */
type LibraryObjectsSearchQueryArgs = {
  filters: Filters
  page: number
}
export function libraryObjectsSearchQuery({
  filters,
  page
}: LibraryObjectsSearchQueryArgs): Promise<LibraryObjectsSearchQueryResp> {
  return API_POST(
    COURSEFLOW_APP.globalContextData.path.json_api.library
      .library__objects_search,
    {
      filters
    }
  )
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
