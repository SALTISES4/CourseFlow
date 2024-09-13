import { apiPaths } from '@cf/router/apiRoutes'
import { VERB } from '@cf/types/enum'
import { API_POST, API_POST_FILE } from '@XMLHTTP/CallWrapper'
import { EmptyPostResp } from '@XMLHTTP/types/query'

//get exported data
export function getExport(
  objectId,
  objectType,
  exportType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const url = apiPaths.json_api.exportImport.export
  API_POST(url, {
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
  const url = apiPaths.json_api.exportImport.import
  API_POST_FILE(
    url,
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
