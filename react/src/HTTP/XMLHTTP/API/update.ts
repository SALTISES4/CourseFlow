import { apiPaths } from '@cf/router/apiRoutes'
import Utility from '@cf/utility/Utility.class'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

/**
 * @updateValue
 * @todo desc: TBD
 * endpoint: workflow/updatevalue/
 *
 * @param objectId
 * @param objectType
 * @param json
 * @param changeField
 * @param callBackFunction
 */
export function updateValueQuery(
  objectId: number,
  objectType: any,
  json: any,
  changeField = false,
  callBackFunction = (data: EmptyPostResp) => {
    return Utility.logger('success')
  }
) {
  const postObject = {
    objectId: objectId,
    objectType: objectType,
    data: json
  }

  const base = apiPaths.json_api.workspace.field__update
  const url = generatePath(base, { id: 10 })
  API_POST(url, postObject).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

//As above, but not debounced
export function updateValueInstantQuery(
  objectId: number,
  objectType: any,
  json: any,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  const url = apiPaths.json_api.workspace.field__update
  API_POST(url, {
    objectId: objectId,
    objectType: objectType,
    data: json
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

//When the drag is complete, this is called to update the back-end
export function dragAction(
  actionData,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  COURSEFLOW_APP.tinyLoader.startLoad()
  $('.ui-draggable').draggable('disable')

  // COURSEFLOW_APP.globalContextData.path.post_paths.inserted_at
  const url = apiPaths.json_api.workflow.object__order
  API_POST(url, actionData).then((response: EmptyPostResp) => {
    callBackFunction(response)
    $('.ui-draggable').draggable('enable')
    COURSEFLOW_APP.tinyLoader.endLoad()
  })
}

//Called when an object in a list is reordered
export function insertedAtInstant(
  objectId,
  objectType,
  parentId,
  parentType,
  newPosition,
  throughType,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  console.log(parentType)
  COURSEFLOW_APP.tinyLoader.startLoad()
  $('.ui-draggable').draggable('disable')

  //   COURSEFLOW_APP.globalContextData.path.post_paths.inserted_at
  const url = apiPaths.json_api.workflow.object__order
  API_POST(url, {
    objectId: objectId,
    objectType: objectType,
    parentId: parentId,
    parentType: parentType,
    newPosition: newPosition,
    throughType: throughType,
    inserted: true,
    allowDifferent: true
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
    $('.ui-draggable').draggable('enable')
    COURSEFLOW_APP.tinyLoader.endLoad()
  })
}

//Causes the specified throughmodel to update its degree
export function updateOutcomenodeDegree(
  nodeId: number,
  outcomeID: number,
  value,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.update_outcomenode_degree,
    {
      nodePk: nodeId,
      outcomePk: outcomeID,
      degree: value
    }
  ).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

//Add an outcome from the parent workflow to an outcome from the current one
export function updateOutcomehorizontallinkDegree(
  outcomePk,
  outcome2Pk,
  degree,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths
      .update_outcomehorizontallink_degree,
    {
      outcomePk: outcomePk,
      objectId: outcome2Pk,
      objectType: 'outcome',
      degree: degree
    }
  ).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

//Set the linked workflow for the node
export function setLinkedWorkflow(
  nodeId,
  workflowId,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  const url = apiPaths.json_api.workflow.link
  API_POST(url, {
    nodePk: nodeId,
    workflowPk: workflowId
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

/**
 * Turn a week into a strategy or vice versa
 *
 * @param weekPk
 * @param isStrategy
 * @param callBackFunction
 */
export function toggleStrategyQuery(
  weekPk: number,
  isStrategy: boolean,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  const url = apiPaths.json_api.workflow.strategy__toggle
  API_POST(url, {
    weekPk: weekPk,
    isStrategy: isStrategy
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

export function updateObjectSet(
  objectId,
  objectType,
  objectsetPk,
  add,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.update_object_set, {
    objectId: objectId,
    objectType: objectType,
    objectsetPk: objectsetPk,
    add: add
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}
