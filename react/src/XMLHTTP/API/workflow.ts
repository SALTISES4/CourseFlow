//Get the data from all child workflows
import {
  EmptyPostResp,
  GetWorkflowSelectQueryResp,
  LinkedWorkflowMenuQueryResp,
  ParentWorkflowInfoQueryResp
} from '@XMLHTTP/types/query'
import {
  WorkflowDataQueryResp,
  WorkflowParentDataQueryResp,
  WorkflowChildDataQueryResp,
  WorkflowsForProjectQueryResp,
  WorkflowContextQueryResp,
  TargetProjectQueryResp
} from '@XMLHTTP/types/query'
import { openWorkflowSelectMenu } from '@XMLHTTP/postTemp'
import { CfObjectType, VERB } from '@cfModule/types/enum'
import { renderMessageBox } from '@cfCommonComponents/menu/MenuComponents.jsx'

/*******************************************************
 * Bulk data API for workflows.
 * For loading all the base JSON that is placed into the
 * redux state.
 *******************************************************/

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
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the data from all parent workflows
export function getWorkflowParentDataQuery(
  workflowPk,
  callBackFunction = (_data: WorkflowParentDataQueryResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_parent_data, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data: WorkflowParentDataQueryResp) {
      console.log('getWorkflowParentData')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

export function getWorkflowChildDataQuery(
  nodePk,
  callBackFunction = (_data: WorkflowChildDataQueryResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_child_data, {
      nodePk: JSON.stringify(nodePk)
    }).done(function (data: WorkflowChildDataQueryResp) {
      console.log('getWorkflowChildData')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the public data from the workflow
export function getPublicWorkflowDataQuery(
  workflowPk,
  callBackFunction = (_data: WorkflowDataQueryResp) => console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.config.get_paths.get_public_workflow_data.replace(
        '0',
        workflowPk
      )
    ).done(function (data: WorkflowDataQueryResp) {
      console.log('getPublicWorkflowData')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the public data from all parent workflows
export function getPublicWorkflowParentDataQuery(
  workflowPk,
  callBackFunction = (_data: WorkflowParentDataQueryResp) =>
    console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.config.get_paths.get_public_workflow_parent_data.replace(
        '0',
        workflowPk
      )
    ).done(function (data: WorkflowParentDataQueryResp) {
      console.log('getPublicWorkflowParentData')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the public data from all child workflows
export function getPublicWorkflowChildDataQuery(
  nodePk,
  callBackFunction = (_data: WorkflowChildDataQueryResp) =>
    console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.config.get_paths.get_public_workflow_child_data.replace(
        '0',
        nodePk
      )
    ).done(function (data: WorkflowChildDataQueryResp) {
      console.log('getPublicWorkflowChildData data')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/*******************************************************
 * @getWorkflowContextQuery
 *
 * Methods for getting groups of workflows or context
 * for workflows.
 *
 * workflow/get-workflow-context/
 *
 *******************************************************/

//get the workflow's context data
export function getWorkflowContextQuery(
  workflowPk,
  callBackFunction = (_data: WorkflowContextQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_context, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data: WorkflowContextQueryResp) {
      console.log('WorkflowContextQueryResp')
      console.log(data)

      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Get possible projects that can be a target for the workflow to be duplicated into
 * @param workflowPk
 * @param updateFunction
 * @param callBackFunction
 */
export function getTargetProjectMenu<T>(
  workflowPk: number,
  updateFunction: (response: T) => void,
  callBackFunction = (_data: TargetProjectQueryResp) => console.log('success')
) {
  $.post(
    COURSEFLOW_APP.config.post_paths.get_target_projects,
    {
      workflowPk: JSON.stringify(workflowPk)
    },
    (data: TargetProjectQueryResp) => {
      // @ts-ignore
      callBackFunction()
      // @TODO call to react render
      openTargetProjectMenu(data, updateFunction)
    }
  )
}

function openTargetProjectMenu(response, updateFunction) {
  if (response.action === VERB.POSTED) {
    renderMessageBox(response, 'target_project_menu', updateFunction)
  } else {
    alert('Failed to find potential projects.')
  }
}

//Get the public data from the workflow
export function getPublicParentWorkflowInfo(
  workflowPk,
  callBackFunction = (_data: ParentWorkflowInfoQueryResp) =>
    console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.config.get_paths.get_public_parent_workflow_info.replace(
        '0',
        workflowPk
      )
    ).done(function (data: ParentWorkflowInfoQueryResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
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
        if (data.action === VERB.POSTED) callBackFunction(data)
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

//Get the workflows that can be selected for the project, shaped for a menu
export function getWorkflowSelectMenuQuery(
  projectPk: number,
  type_filter: CfObjectType,
  get_strategies: boolean,
  self_only: boolean,
  callBackFunction: (_data: GetWorkflowSelectQueryResp) => void
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
    .done(function (data: GetWorkflowSelectQueryResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
    .catch((err) => {
      console.log(err)
    })
}
