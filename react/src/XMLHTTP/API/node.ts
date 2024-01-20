//Create a nodelink from the source to the target, at the given ports
import { VERB } from '@cfModule/types/enum'
import {
  NewNodeQueryResp,
  UpdateOutcomenodeDegreeResp
} from '@XMLHTTP/types/query'
import { ToDefine } from '@cfModule/types/common'

/*******************************************************
 *
 *  endpoint: workflow/node-link/new
 *  json-api-post-new-node-link
 *******************************************************/
export function newNodeLink(
  source_node,
  target_node,
  source_port,
  target_port,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.new_node_link, {
      nodePk: JSON.stringify(source_node),
      objectID: JSON.stringify(target_node),
      objectType: JSON.stringify('node'),
      sourcePort: JSON.stringify(source_port),
      targetPort: JSON.stringify(target_port)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Add a new node to a week
export function newNodeQuery(
  weekPk,
  position = -1,
  column = -1,
  column_type = -1,
  callBackFunction = (_data: NewNodeQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.new_node, {
      weekPk: JSON.stringify(weekPk),
      position: JSON.stringify(position),
      columnPk: JSON.stringify(column),
      columnType: JSON.stringify(column_type)
    }).done(function (data: NewNodeQueryResp) {
      if (data.action === VERB.POSTED) {
        callBackFunction(data)
      } else {
        window.fail_function(data.action)
      }
    })
  } catch (err) {
    window.fail_function()
  }
}

//get nodes for the workflow
export function getWorkflowNodes(
  workflowPk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_nodes, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Causes the specified throughmodel to update its degree
export function updateOutcomenodeDegree(
  nodeID: number,
  outcomeID: number,
  value,
  callBackFunction = (_data: UpdateOutcomenodeDegreeResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.update_outcomenode_degree, {
      nodePk: JSON.stringify(nodeID),
      outcomePk: JSON.stringify(outcomeID),
      degree: JSON.stringify(value)
    }).done(function (data: UpdateOutcomenodeDegreeResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
