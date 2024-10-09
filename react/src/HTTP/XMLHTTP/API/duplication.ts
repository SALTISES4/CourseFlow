import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { DuplicateBaseItemQueryResp, EmptyPostResp } from '@XMLHTTP/types/query'

/**
 *
 * @duplicateBaseItemQuery
 *
 *
 *
 * Duplicate a project workflow, strategy, or project
 *
 * @param itemPk
 * @param objectType
 * @param projectID
 * @param callBackFunction
 */
export function duplicateBaseItemQuery(
  itemPk: number,
  objectType: string,
  projectID: number,
  callBackFunction = (_data: DuplicateBaseItemQueryResp) =>
    console.log('success')
) {
  console.log('duplicating base item')
  const sendPostRequest = (url, data) => {
    API_POST(url, data).then((response: DuplicateBaseItemQueryResp) => {
      callBackFunction(response)
    })
  }

  const itemPkString = itemPk
  const projectPkString = projectID

  if (objectType === CfObjectType.PROJECT) {
    const url = apiPaths.json_api.project.duplicate
    sendPostRequest(url, {
      projectPk: itemPkString
    })
  } else if (objectType === CfObjectType.STRATEGY) {
    const url = apiPaths.json_api.workflow.strategy__duplicate
    sendPostRequest(url, {
      workflowPk: itemPkString
    })
  } else {
    const url = apiPaths.json_api.workflow.duplicate
    sendPostRequest(url, {
      workflowPk: itemPkString,
      projectPk: projectPkString
    })
  }
}

//Causes the specified object to insert a sibling after itself
export function duplicateSelfQuery(
  objectId: number,
  objectType: any,
  parentID: number,
  parentType: any,
  throughType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.duplicate_self, {
    parentID: parentID,
    parentType: parentType,
    objectId: objectId,
    objectType: objectType,
    throughType: throughType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}
