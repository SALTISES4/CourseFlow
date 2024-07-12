import { EmptyPostResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { API_POST } from '../PostFunctions'


//@todo is this used? I don't think we want this at all
//get exported data
export function getExport(
  objectID,
  objectType,
  exportType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.config.post_paths.get_export, {
    objectID: objectID,
    objectType: objectType,
    exportType: exportType
  })
    .then((response:EmptyPostResp)=>{
      if(response.action == VERB.POSTED)callBackFunction(response)
      else window.fail_function(response.action)
    })
}
