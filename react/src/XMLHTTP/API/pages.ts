import {
  ExploreQueryResp,
  FavouritesQueryResp,
  HomeQueryResp,
  LibraryQueryResp,
  SearchAllObjectsQueryResp
} from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { ToDefine } from '@cfModule/types/common'
import { API_POST } from '../PostFunctions'

/*******************************************************
 * HOME PAGE
 *******************************************************/
export async function fetchHomeContext(): Promise<HomeQueryResp> {
  try {
    const response = await $.get(
      COURSEFLOW_APP.config.json_api_paths.pages.home
    ).promise()
    return response // Automatically returned as a promise
  } catch (error) {
    throw new Error('Failed to fetch data')
  }
}

export async function fetchExploreContext(): Promise<ExploreQueryResp> {
  try {
    const response = await $.get(
      COURSEFLOW_APP.config.json_api_paths.pages.explore
    ).promise()
    return response // Automatically returned as a promise
  } catch (error) {
    throw new Error('Failed to fetch data')
  }
}

/*******************************************************
 * LIBRARY PAGES
 *******************************************************/
//Toggle whether a project or activity is a favourite for the user
export function toggleFavourite(
  objectID,
  objectType,
  favourite,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    API_POST(COURSEFLOW_APP.config.post_paths.toggle_favourite, {
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
    API_POST(COURSEFLOW_APP.config.post_paths.search_all_objects, {
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
 */
export function getLibraryQuery(
  callBackFunction = (_data: LibraryQueryResp) => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_library).done(function (
      response: LibraryQueryResp
    ) {
      callBackFunction(response)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Get the library projects
 * @param callBackFunction
 */
export function getFavouritesQuery(
  callBackFunction = (_data: FavouritesQueryResp) => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_favourites).done(function (
      response: FavouritesQueryResp
    ) {
      callBackFunction(response)
    })
  } catch (err) {
    window.fail_function()
  }
}
