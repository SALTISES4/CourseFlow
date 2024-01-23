import { EmptyPostResp, DuplicateBaseItemQueryResp } from '@XMLHTTP/types/query'
import { VERB, OBJECT_TYPE } from '@cfModule/types/enum'

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
  const sendPostRequest = (url, data) => {
    $.post(url, data).done(function (response: DuplicateBaseItemQueryResp) {
      console.log('duplicateBaseItemQuery response')
      console.log(response)

      if (response.action === VERB.POSTED) {
        callBackFunction(response)
      } else {
        window.fail_function(response.action)
      }
    })
  }

  try {
    const itemPkString = JSON.stringify(itemPk)
    const projectPkString = JSON.stringify(projectID)

    if (objectType === OBJECT_TYPE.PROJECT) {
      sendPostRequest(COURSEFLOW_APP.config.post_paths.duplicate_project_ajax, {
        projectPk: itemPkString
      })
    } else if (objectType === OBJECT_TYPE.STRATEGY) {
      sendPostRequest(
        COURSEFLOW_APP.config.post_paths.duplicate_strategy_ajax,
        { workflowPk: itemPkString }
      )
    } else {
      sendPostRequest(
        COURSEFLOW_APP.config.post_paths.duplicate_workflow_ajax,
        { workflowPk: itemPkString, projectPk: projectPkString }
      )
    }
  } catch (err) {
    window.fail_function()
  }
}


//Causes the specified object to insert a sibling after itself
export function duplicateSelfQuery(
  objectID: number,
  objectType: any,
  parentID: number,
  parentType: any,
  throughType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.duplicate_self, {
      parentID: JSON.stringify(parentID),
      parentType: JSON.stringify(parentType),
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      throughType: JSON.stringify(throughType)
    }).done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
