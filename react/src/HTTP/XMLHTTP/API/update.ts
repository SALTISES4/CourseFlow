import { apiPaths } from '@cf/router/apiRoutes'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { EmptyPostResp } from '@XMLHTTP/types/query'

//
/**
 * @updateValue
 * Update the value of an object in database. JSON may be partial. Debounced in case the user is typing a lot.
 *
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
  callBackFunction = (data: EmptyPostResp) => console.log('success')
) {
  const t = 1000
  const previousCall = document.lastUpdateCall

  document.lastUpdateCall = {
    time: Date.now(),
    id: objectId,
    type: objectType,
    field: Object.keys(json)[0]
  }

  if (previousCall && document.lastUpdateCall.time - previousCall.time <= t) {
    clearTimeout(document.lastUpdateCallTimer)
  }
  if (
    previousCall &&
    (previousCall.id !== document.lastUpdateCall.id ||
      previousCall.type !== document.lastUpdateCall.type ||
      previousCall.field !== document.lastUpdateCall.field)
  ) {
    document.lastUpdateCallFunction()
  }
  const post_object = {
    objectId: objectId,
    objectType: objectType,
    data: json,
    changeFieldID: 0
  }

  if (changeField) {
    // @ts-ignore
    post_object.changeFieldID = // @ts-ignore
      COURSEFLOW_APP.contextData.changeFieldID as number
  }

  document.lastUpdateCallFunction = () => {
    const url = apiPaths.json_api.workspace.field__update
    API_POST(url, post_object).then((response: EmptyPostResp) => {
callBackFunction(response)
    })
  }
  document.lastUpdateCallTimer = setTimeout(document.lastUpdateCallFunction, t)
}

//As above, but not debounced
export function updateValueInstantQuery(
  objectId: number,
  objectType: any,
  json: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
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

//When the drag is complete, this is called to actually update the back-end
export function dragAction(
  action_data,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  COURSEFLOW_APP.tinyLoader.startLoad()
  $('.ui-draggable').draggable('disable')

  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.inserted_at,
    action_data
  ).then((response: EmptyPostResp) => {
    callBackFunction(response)
    $('.ui-draggable').draggable('enable')
    COURSEFLOW_APP.tinyLoader.endLoad()
  })
}

//Called when an object in a list is reordered
export function insertedAtInstant(
  objectId,
  objectType,
  parentID,
  parentType,
  newPosition,
  throughType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  console.log(parentType)
  COURSEFLOW_APP.tinyLoader.startLoad()
  $('.ui-draggable').draggable('disable')
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.inserted_at, {
    objectId: objectId,
    objectType: objectType,
    parentID: parentID,
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
  nodeID: number,
  outcomeID: number,
  value,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.update_outcomenode_degree,
    {
      nodePk: nodeID,
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
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
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
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
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
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
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
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
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
