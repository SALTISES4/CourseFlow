import { EmptyPostResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { API_POST } from '../PostFunctions'

export function deleteSelfQuery(
  objectID: number,
  objectType: any,
  soft = false,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  let path
  if (soft) path = COURSEFLOW_APP.config.post_paths.delete_self_soft
  else path = COURSEFLOW_APP.config.post_paths.delete_self

  API_POST(path, {
    objectID: objectID,
    objectType: objectType
  })
    .then((response:EmptyPostResp)=>{
      if(response.action == VERB.POSTED)callBackFunction(response)
      else window.fail_function(response.action)
    })
}

//Causes the specified object to undelete itself
export function restoreSelfQuery(
  objectID: number,
  objectType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.config.post_paths.restore_self, {
    objectID: objectID,
    objectType: objectType
  })
    .then((response:EmptyPostResp)=>{
      if(response.action == VERB.POSTED)callBackFunction(response)
      else window.fail_function(response.action)
    })
}
