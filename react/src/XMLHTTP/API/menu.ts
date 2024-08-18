import { LibraryQueryResp, FavouritesQueryResp } from '@XMLHTTP/types/query'
import { EDiscipline } from '@XMLHTTP/types/entity'

/**
 * Get the library projects
 * @param callBackFunction
 */
export function getLibraryQuery(
  callBackFunction = (_data: LibraryQueryResp) => console.log('success')
) {
  $.get(COURSEFLOW_APP.path.get_paths.get_library)
    .done(function (response: LibraryQueryResp) {
      callBackFunction(response)
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
  $.get(COURSEFLOW_APP.path.json_api.library.library__favourites__projects)
    .done(function (response: FavouritesQueryResp) {
      callBackFunction(response)
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
  $.get(COURSEFLOW_APP.path.get_paths.get_disciplines)
    .done(function (response: EDiscipline[]) {
      callBackFunction(response)
    })
    .fail(function (error) {
      // Handle error specific to the AJAX request
      window.fail_function()
    })
}
