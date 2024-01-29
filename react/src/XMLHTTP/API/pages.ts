import {
  FavouritesQueryResp,
  LibraryQueryResp,
  SearchAllObjectsQueryResp
} from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { ToDefine } from '@cfModule/types/common'

/*******************************************************
 * LIBRARY PAGES
 *******************************************************/

//Add an outcome to a node
export function toggleFavourite(
  objectID,
  objectType,
  favourite,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.toggle_favourite, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      favourite: JSON.stringify(favourite)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
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
    $.post(COURSEFLOW_APP.config.post_paths.search_all_objects, {
      filter: JSON.stringify(filter),
      additional_data: JSON.stringify(data)
    }).done(function (_data: SearchAllObjectsQueryResp) {
      callBackFunction(_data)
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
      data: LibraryQueryResp
    ) {
      callBackFunction(data)
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
      data: FavouritesQueryResp
    ) {
      callBackFunction(data)
    })
  } catch (err) {
    window.fail_function()
  }
}
