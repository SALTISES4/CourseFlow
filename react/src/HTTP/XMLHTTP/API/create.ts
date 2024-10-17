import { apiPaths } from '@cf/router/apiRoutes'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { AddTerminologyQueryResp, EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

//Add a new node to a week
export function newNodeQuery(
  weekPk,
  position = -1,
  column = -1,
  columnType = -1,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const url = apiPaths.json_api.node.create
  API_POST(url, {
    weekPk: weekPk,
    position: position,
    columnPk: column,
    columnType: columnType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
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
    callBackFunction(response)
  })
}

//Add a strategy to the workflow
export function addStrategyQuery(
  workflowPk: number,
  position = -1,
  strategyPk = -1,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const url = apiPaths.json_api.workflow.strategy__add_to_workflow
  API_POST(url, {
    workflowPk: workflowPk,
    position: position,
    objectId: strategyPk,
    objectType: 'workflow'
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

export function newNodeLink(
  sourceNode,
  targetNode,
  sourcePort,
  targetPort,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const url = apiPaths.json_api.node.link__create
  API_POST(url, {
    nodePk: sourceNode,
    objectId: targetNode,
    objectType: 'node',
    sourcePort: sourcePort,
    targetPort: targetPort
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

//Causes the specified object to insert a child to itself
export function insertChildQuery(
  objectId: number,
  objectType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(apiPaths.json_api.workflow.object__insert_child, {
    objectId: objectId,
    objectType: objectType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

export function insertSiblingQuery(
  objectId: number,
  objectType: any,
  parentId: number,
  parentType: any,
  throughType: any,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(apiPaths.json_api.workflow.object__insert_sibling, {
    objectId,
    objectType,
    parentId,
    parentType,
    throughType
  })
    .then((response: EmptyPostResp) => {
      callBackFunction(response)
    })
    .catch((e) => {
      console.log(e)
      COURSEFLOW_APP.tinyLoader.endLoad()
    })
}

/**
 * Add an object set to a project
 *
 * @param projectPk
 * @param term
 * @param title
 * @param translationPlural
 * @param callBackFunction
 */
export function addObjectSetQuery(
  id: number,
  term: any,
  title: any,
  translationPlural: any,
  callBackFunction = (_data: AddTerminologyQueryResp) => console.log('success')
) {
  const base = apiPaths.json_api.project.object_set__create
  const url = generatePath(base, { id })

  API_POST(url, {
    projectPk: id,
    term: term,
    title: title,
    translationPlural: translationPlural
  }).then((response: AddTerminologyQueryResp) => {
    callBackFunction(response)
  })
}
