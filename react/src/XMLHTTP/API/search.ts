import { EmptyPostResp, SearchAllObjectsQueryResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'

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