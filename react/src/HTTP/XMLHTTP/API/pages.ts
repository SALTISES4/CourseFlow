import { apiPaths } from '@cf/router/apiRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import { API_GET } from '@XMLHTTP/CallWrapper'
import { PageHomeQueryResp, PageLibraryQueryResp } from '@XMLHTTP/types/query'

/*******************************************************
 * HOME PAGE
 *******************************************************/
export async function getHomeContext(): Promise<PageHomeQueryResp> {
  const url = apiPaths.json_api.library.home
  return API_GET<PageHomeQueryResp>(url)
}

/*******************************************************
 * LIBRARY PAGES
 *******************************************************/

/**
 * Get the library projects
 * @param callBackFunction
 * this uses a callback because not yet used in hook
 */
export async function getLibraryContext(): Promise<PageLibraryQueryResp> {
  const url = apiPaths.json_api.library.library__library__projects

  return API_GET<PageLibraryQueryResp>(url)
}
