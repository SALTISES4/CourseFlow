import { EmptyPostResp, DuplicateBaseItemQueryResp } from '@XMLHTTP/types/query'
import { VERB, OBJECT_TYPE } from '@cf/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'

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
      if (response.action == VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
    })
  }

  const itemPkString = itemPk
  const projectPkString = projectID

  if (objectType === OBJECT_TYPE.PROJECT) {
    sendPostRequest(
      COURSEFLOW_APP.globalContextData.path.post_paths.duplicate_project_ajax,
      {
        projectPk: itemPkString
      }
    )
  } else if (objectType === OBJECT_TYPE.STRATEGY) {
    sendPostRequest(
      COURSEFLOW_APP.globalContextData.path.post_paths.duplicate_strategy_ajax,
      {
        workflowPk: itemPkString
      }
    )
  } else {
    sendPostRequest(
      COURSEFLOW_APP.globalContextData.path.post_paths.duplicate_workflow_ajax,
      {
        workflowPk: itemPkString,
        projectPk: projectPkString
      }
    )
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
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
