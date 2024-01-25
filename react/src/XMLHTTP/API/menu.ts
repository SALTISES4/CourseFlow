import {
  HomeQueryResp,
  LibraryQueryResp,
  FavouritesQueryResp
} from '@XMLHTTP/types/query'
import { EDiscipline } from '@XMLHTTP/types/entity'

/**
 * Get the home projects
 * @param callBackFunction
 */
export function getHomeQuery(
  callBackFunction = (_data: HomeQueryResp) => console.log('success')
) {
  $.get(COURSEFLOW_APP.config.get_paths.get_home)
    .done(function (data: HomeQueryResp) {
      callBackFunction(data)
    })
    .fail(function (error) {
      // Handle error specific to the AJAX request
      window.fail_function()
    })
}

/**
 * Get the library projects
 * @param callBackFunction
 */
export function getLibraryQuery(
  callBackFunction = (_data: LibraryQueryResp) => console.log('success')
) {
  $.get(COURSEFLOW_APP.config.get_paths.get_library)
    .done(function (data: LibraryQueryResp) {
      callBackFunction(data)
    })
    .fail(function (error) {
      // Handle error specific to the AJAX request
      window.fail_function()
    })
}

/**
 * Get the library projects
 * @param callBackFunction
 */
export function getFavouritesQuery(
  callBackFunction = (_data: FavouritesQueryResp) => console.log('success')
) {
  $.get(COURSEFLOW_APP.config.get_paths.get_favourites)
    .done(function (data: FavouritesQueryResp) {
      callBackFunction(data)
    })
    .fail(function (error) {
      // Handle error specific to the AJAX request
      window.fail_function()
    })
}

//Get the list of possible disciplines
export function getDisciplines(
  callBackFunction = (_data: EDiscipline[]) => console.log('success')
) {
  $.get(COURSEFLOW_APP.config.get_paths.get_disciplines)
    .done(function (data: EDiscipline[]) {
      callBackFunction(data)
    })
    .fail(function (error) {
      // Handle error specific to the AJAX request
      window.fail_function()
    })
}
