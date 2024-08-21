import { EmptyPostResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { API_POST, API_POST_FILE } from '@XMLHTTP/CallWrapper'


//get exported data
export function getExport(
  objectID,
  objectType,
  exportType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.path.post_paths.get_export, {
    objectID: objectID,
    objectType: objectType,
    exportType: exportType
  })
    .then((response:EmptyPostResp)=>{
      if(response.action == VERB.POSTED)callBackFunction(response)
      else window.fail_function(response.action)
    })
}

//import from file data
export function importData(
  objectID,
  objectType,
  importType,
  myFile,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST_FILE(COURSEFLOW_APP.path.post_paths.import_data, {
    objectID: objectID,
    objectType: objectType,
    importType: importType,
  },myFile)
    .then((response:EmptyPostResp)=>{
      if(response.action == VERB.POSTED)callBackFunction(response)
      else window.fail_function(response.action)
    })
}
