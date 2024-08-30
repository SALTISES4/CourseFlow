import {
  EmptyPostResp,
  LibraryObjectsSearchQueryResp
} from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'

/**
 * Search entire library
 *
 * @param filter
 * @param data
 * @param callBackFunction
 */
// export function searchAllObjectsQuery(
//   filter,
//   data,
//   callBackFunction = (_data: SearchAllObjectsQueryResp) =>
//     console.log('success')
// ) {
//   API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.search_all_objects, {
//     filter: filter,
//     additional_data: data
//   }).then((response: SearchAllObjectsQueryResp) => {
//     if (response.action == VERB.POSTED) callBackFunction(response)
//     else window.fail_function(response.action)
//   })
// }
