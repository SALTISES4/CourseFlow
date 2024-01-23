import { EmptyPostResp, HomeQueryResp, LibraryQueryResp, FavouritesQueryResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { EDiscipline } from '@XMLHTTP/types/entity'

/**
 * Get the home projects
 * @param callBackFunction
 */
export function getHomeQuery(
  callBackFunction = (_data: HomeQueryResp) => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_home).done(function (
      data: HomeQueryResp
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

//Get the list of possible disciplines
export function getDisciplines(
  callBackFunction = (_data: EDiscipline[]) => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_disciplines).done(
      function (data: EDiscipline[]) {
        callBackFunction(data)
      }
    )
  } catch (err) {
    window.fail_function()
  }
}
