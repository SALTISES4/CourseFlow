//Get the library projects
import {
  HomeQueryResp,
  LibraryQueryResp,
  SearchAllObjectsQueryResp
} from '@XMLHTTP/types'

export function getLibraryQuery(
  callBackFunction = (data: LibraryQueryResp) => console.log('success')
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

//Search entire library
export function searchAllObjectsQuery(
  filter,
  data,
  callBackFunction = (data: SearchAllObjectsQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.search_all_objects, {
      filter: JSON.stringify(filter),
      additional_data: JSON.stringify(data)
    }).done(function (data: SearchAllObjectsQueryResp) {
      callBackFunction(data)
    })
  } catch (err) {
    window.fail_function()
  }
}

export default {}

//Get the home projects
export function getHomeQuery(
  callBackFunction = (data: HomeQueryResp) => console.log('success')
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
