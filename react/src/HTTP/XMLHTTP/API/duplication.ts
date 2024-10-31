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

  // project duplicate moved to own function (was in this if statement before)
  if (objectType === CfObjectType.STRATEGY) {
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
