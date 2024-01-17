//Get the data from all child workflows
import { DATA_ACTIONS } from '@XMLHTTP/common'
import {
  GetWorkflowSelectMenuResp,
  LinkedWorkflowMenuQueryResp,
  ParentWorkflowInfoQueryResp
} from '@XMLHTTP/types/query'
import {
  WorkflowDataQueryResp,
  WorkflowsForProjectQueryResp
} from '@XMLHTTP/types'
import { ToDefine } from '@cfModule/types/common'
import { openWorkflowSelectMenu } from '@XMLHTTP/postTemp'
import { CfObjectType } from '@cfModule/types/enum'

/*******************************************************
 * WORKFLOWS
 *******************************************************/

/**
 * @getWorkflowsForProjectQuery
 *
 *
 *
 * Get the workflows for a project
 * @param projectPk
 * @param callBackFunction
 */
export function getWorkflowsForProjectQuery(
  projectPk,
  callBackFunction = (_data: WorkflowsForProjectQueryResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflows_for_project, {
      projectPk: projectPk
    }).done(function (_data: WorkflowsForProjectQueryResp) {
      callBackFunction(_data)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Set the linked workflow for the node
export function setLinkedWorkflow(
  node_id,
  workflow_id,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  $.post(COURSEFLOW_APP.config.post_paths.set_linked_workflow, {
    nodePk: node_id,
    workflowPk: workflow_id
  }).done(function (data) {
    if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
    else window.fail_function(data.action)
  })
}

//get the workflow's context data
export function getWorkflowContext(
  workflowPk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_context, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
export function getWorkflowChildDataQuery(
  nodePk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_child_data, {
      nodePk: JSON.stringify(nodePk)
    }).done(function (data) {
      console.log('getWorkflowChildData')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the data from all parent workflows
export function getWorkflowParentDataQuery(
  workflowPk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_parent_data, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      console.log('getWorkflowParentData')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the public data from the workflow
export function getPublicWorkflowDataQuery(
  workflowPk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.config.get_paths.get_public_workflow_data.replace(
        '0',
        workflowPk
      )
    ).done(function (data) {
      console.log('getPublicWorkflowData')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the public data from all parent workflows
export function getPublicWorkflowParentDataQuery(
  workflowPk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.config.get_paths.get_public_workflow_parent_data.replace(
        '0',
        workflowPk
      )
    ).done(function (data) {
      console.log('getPublicWorkflowParentData')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the public data from all child workflows
export function getPublicWorkflowChildDataQuery(
  nodePk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.config.get_paths.get_public_workflow_child_data.replace(
        '0',
        nodePk
      )
    ).done(function (data) {
      console.log('getPublicWorkflowChildData data')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Get the list of workflows we can link to a node
 *
 * endpoint: workflow/get-possible-linked-workflows
 *
 * @param nodeData
 * @param updateFunction
 * @param callBackFunction
 */
export function getLinkedWorkflowMenuQuery(
  nodeData,
  updateFunction,
  callBackFunction = (_data?: LinkedWorkflowMenuQueryResp) =>
    console.log('success')
) {
  $.post(
    COURSEFLOW_APP.config.post_paths.get_possible_linked_workflows,
    {
      nodePk: JSON.stringify(nodeData.id)
    },
    (_data: LinkedWorkflowMenuQueryResp) => {
      callBackFunction()
      // @TODO call to react render
      //  openLinkedWorkflowMenu(_data, updateFunction)
    }
  )
}

/**
 * @getWorkflowDataQuery
 *
 * endpoint: /workflow/get-workflow-data/
 *
 * Get the data from the workflow
 * @param workflowPk
 * @param callBackFunction
 */
export function getWorkflowDataQuery(
  workflowPk,
  callBackFunction = (_data: WorkflowDataQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_data, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data: WorkflowDataQueryResp) {
      // @todo this is mostly typed now
      // console.log('getWorkflowDataQuery data')
      // console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * @getParentWorkflowInfo
 *
 * Get the info from the parent workflow
 *
 * endpoint course-flow/parentworkflows/get/
 *
 * @param workflowPk
 * @param callBackFunction
 */
export function getParentWorkflowInfoQuery(
  workflowPk: number,
  callBackFunction = (_data: ParentWorkflowInfoQueryResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_parent_workflow_info, {
      workflowPk: JSON.stringify(workflowPk)
    })
      .done(function (data: ParentWorkflowInfoQueryResp) {
        if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
        else window.fail_function(data.action)
      })
      .catch((err) => {
        console.log(err)
      })
  } catch (err) {
    console.log('getParentWorkflowInfoQuery error in try/catc')
    console.log(err)
    window.fail_function()
  }
}

//set visibility of workflow
// @todo can this be removed ?
export function setWorkflowVisibilityQuery(
  liveprojectPk,
  workflowPk,
  visible,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.set_workflow_visibility, {
      liveprojectPk: JSON.stringify(liveprojectPk),
      workflowPk: JSON.stringify(workflowPk),
      visible: JSON.stringify(visible)
    }).done(function (data) {
      console.log('setWorkflowVisibilityQuery data')
      console.log(data)

      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
} //set visibility of workflow

//Get the public data from the workflow
export function getPublicParentWorkflowInfo(
  workflowPk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.config.get_paths.get_public_parent_workflow_info.replace(
        '0',
        workflowPk
      )
    ).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the workflows that can be selected for the project, shaped for a menu
export function getWorkflowSelectMenuQuery(
  projectPk: number,
  type_filter: CfObjectType,
  get_strategies: boolean,
  self_only: boolean,
  callBackFunction: (_data: GetWorkflowSelectMenuResp) => void
  // updateFunction,
  //  receiptFunction
) {
  $.post(
    COURSEFLOW_APP.config.post_paths.get_possible_added_workflows,
    {
      projectPk: JSON.stringify(projectPk),
      type_filter: JSON.stringify(type_filter),
      get_strategies: JSON.stringify(get_strategies),
      self_only: JSON.stringify(self_only)
    }
    // (data) => {
    //   // @TODO call to react render
    //   receiptFunction(data)
    // }
  )
    .done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
    .catch((err) => {
      console.log(err)
    })
}
