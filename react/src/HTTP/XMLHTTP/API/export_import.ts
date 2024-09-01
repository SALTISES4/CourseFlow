import { EmptyPostResp } from '@XMLHTTP/types/query'
import { VERB } from '@cf/types/enum'
import { API_POST, API_POST_FILE } from '@XMLHTTP/CallWrapper'

//get exported data
export function getExport(
  objectId,
  objectType,
  exportType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.get_export, {
    objectId: objectId,
    objectType: objectType,
    exportType: exportType
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

//import from file data
export function importData(
  objectId,
  objectType,
  importType,
  myFile,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST_FILE(
    COURSEFLOW_APP.globalContextData.path.post_paths.import_data,
    {
      objectId: objectId,
      objectType: objectType,
      importType: importType
    },
    myFile
  ).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
