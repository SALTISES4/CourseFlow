import {
  PageExploreQueryResp,
  PageHomeQueryResp,
  PageLibraryQueryResp
} from '@XMLHTTP/types/query'
import { API_GET } from '@XMLHTTP/CallWrapper'
import { _t } from '@cf/utility/utilityFunctions'

/*******************************************************
 * HOME PAGE
 *******************************************************/
export async function getHomeContext(): Promise<PageHomeQueryResp> {
  const url = COURSEFLOW_APP.globalContextData.path.json_api.library.home
  return API_GET<PageHomeQueryResp>(url)
}

/*******************************************************
 * LIBRARY PAGES
 *******************************************************/

export async function getExploreContext(): Promise<PageExploreQueryResp> {
  const url = COURSEFLOW_APP.globalContextData.path.json_api.library.explore
  return API_GET<PageExploreQueryResp>(url)
}
/**
 * Get the library projects
 * @param callBackFunction
 * this uses a callback because not yet used in hook
 */
export async function getLibraryContext(): Promise<PageLibraryQueryResp> {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.library
      .library__library__projects

  return API_GET<PageLibraryQueryResp>(url)
}
