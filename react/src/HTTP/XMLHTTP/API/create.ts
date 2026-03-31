import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { AddTerminologyQueryResp, EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

//Add a new node to a week
export function newNodeQuery(
  weekid: string,
  position = -1,
  column = -1,
  columnType = -1,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  const url = apiPaths.json_api.node.create
  API_POST(url, {
    weekPk: weekId,
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
 * @param object_setId
 * @param callBackFunction
 */
export function newOutcomeQuery(
  workflowPk: number,
  object_setid: string,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.new_outcome, {
    workflowPk: workflowPk,
    objectSetPk: object_setId
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

//Add a strategy to the workflow
export function addStrategyQuery(
  workflowPk: number,
  position = -1,
  strategyPk = -1,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
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

export function newNodelinkQuery(
  sourceNodeid: string,
  targetNodeid: string,
  sourcePort: number,
  targetPort: number,
  callBackFunction = (_data: EmptyPostResp) => Utility.logger('success')
) {
  const url = apiPaths.json_api.node.link_create
  API_POST(url, {
    nodePk: sourceNodeId,
    objectId: targetNodeId,
    objectType: CfObjectType.NODE,
    sourcePort: sourcePort,
    targetPort: targetPort
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
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
  id: string,
  term: any,
  title: any,
  translationPlural: any,
  callBackFunction = (_data: AddTerminologyQueryResp) =>
    Utility.logger('success')
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
