import { EmptyPostResp } from '@XMLHTTP/types/query'
import { VERB } from '@cf/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'

export function deleteSelfQuery(
  objectId: number,
  objectType: any,
  soft = false,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  let path
  if (soft)
    path = COURSEFLOW_APP.globalContextData.path.post_paths.delete_self_soft
  else path = COURSEFLOW_APP.globalContextData.path.post_paths.delete_self

  API_POST(path, {
    objectId: objectId,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

//Causes the specified object to undelete itself
export function restoreSelfQuery(
  objectId: number,
  objectType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.restore_self, {
    objectId: objectId,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
