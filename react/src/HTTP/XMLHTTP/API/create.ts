import { EmptyPostResp, AddTerminologyQueryResp } from '@XMLHTTP/types/query'
import { VERB } from '@cf/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'

//Add a new node to a week
export function newNodeQuery(
  weekPk,
  position = -1,
  column = -1,
  column_type = -1,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.new_node, {
    weekPk: weekPk,
    position: position,
    columnPk: column,
    columnType: column_type
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

/**
 * @newOutcome
 *
 * Add a new outcome to a workflow
 *
 * endpoint: workflow/outcome/new
 *
 * @param workflowPk
 * @param object_set_id
 * @param callBackFunction
 */
export function newOutcomeQuery(
  workflowPk: number,
  object_set_id: number,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.new_outcome, {
    workflowPk: workflowPk,
    objectsetPk: object_set_id
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

//Add a strategy to the workflow
export function addStrategyQuery(
  workflowPk: number,
  position = -1,
  strategyPk = -1,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.add_strategy, {
    workflowPk: workflowPk,
    position: position,
    objectId: strategyPk,
    objectType: 'workflow'
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

export function newNodeLink(
  source_node,
  target_node,
  source_port,
  target_port,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.new_node_link, {
    nodePk: source_node,
    objectId: target_node,
    objectType: 'node',
    sourcePort: source_port,
    targetPort: target_port
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

//Causes the specified object to insert a child to itself
export function insertChildQuery(
  objectId: number,
  objectType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.insert_child, {
    objectId: objectId,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

//Causes the specified object to insert a sibling after itself
export function insertSiblingQuery(
  objectId: number,
  objectType: any,
  parentID: number,
  parentType: any,
  throughType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.insert_sibling, {
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

/**
 * Add an object set to a project
 *
 * @param projectPk
 * @param term
 * @param title
 * @param translation_plural
 * @param callBackFunction
 */
export function addTerminologyQuery(
  projectPk: number,
  term: any,
  title: any,
  translation_plural: any,
  callBackFunction = (_data: AddTerminologyQueryResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.add_terminology, {
    projectPk: projectPk,
    term: term,
    title: title,
    translation_plural: translation_plural
  }).then((response: AddTerminologyQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
