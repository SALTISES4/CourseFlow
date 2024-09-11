//Get the data from all child workflows
import {
  CfObjectType,
  LibraryObjectType,
  VERB,
  WorkSpaceType
} from '@cf/types/enum'
import { renderMessageBox } from '@cfComponents/__LEGACY/menuLegacy/MenuComponents.jsx'
import Library from '@cfPages/Styleguide/views/Library'
import { API_GET, API_POST } from '@XMLHTTP/CallWrapper'
import {
  EmptyPostResp,
  ProjectsForCreateQueryResp,
  TargetProjectQueryResp,
  WorkflowChildDataQueryResp,
  WorkflowContextQueryResp,
  WorkflowDataQueryResp,
  WorkflowGroupsDataPackage,
  WorkflowParentDataQueryResp,
  WorkflowsForProjectQueryResp
} from '@XMLHTTP/types/query'
import {
  GetWorkflowByIdQueryResp,
  GetWorkflowSelectQueryResp,
  LinkedWorkflowMenuQueryResp,
  ParentWorkflowInfoQueryResp
} from '@XMLHTTP/types/query'

/*******************************************************
 * Bulk data API for workflows.
 * For loading all the base JSON that is placed into the
 * redux state.
 *******************************************************/

export async function getWorkflowById(
  id: number
): Promise<GetWorkflowByIdQueryResp> {
  const params = new URLSearchParams({ id: id.toString() }).toString()
  const url = `${COURSEFLOW_APP.globalContextData.path.json_api.workflow.detail}?${params}`
  return API_GET<GetWorkflowByIdQueryResp>(url)
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
    API_POST(
      COURSEFLOW_APP.globalContextData.path.post_paths.get_workflow_data,
      {
        workflowPk: workflowPk
      }
    ).then((response: WorkflowDataQueryResp) => {
      if (response.action == VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

// @todo combine these
//Get the public data from the workflow
export function getPublicWorkflowDataQuery(
  workflowPk,
  callBackFunction = (_data: WorkflowDataQueryResp) => console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.globalContextData.path.get_paths.get_public_workflow_data.replace(
        '0',
        workflowPk
      )
    ).done(function (response: WorkflowDataQueryResp) {
      if (response.action === VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the data from all parent workflows
export function getWorkflowParentDataQuery(
  id: number
): Promise<WorkflowParentDataQueryResp> {
  return API_POST<WorkflowParentDataQueryResp>(
    COURSEFLOW_APP.globalContextData.path.post_paths.get_workflow_parent_data,
    {
      workflowPk: id
    }
  )
}

// @todo combine these
//Get the public data from all parent workflows
export function getWorkflowParentDataQueryLegacy(
  workflowPk,
  callBackFunction = (_data: WorkflowParentDataQueryResp) =>
    console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.globalContextData.path.get_paths.get_public_workflow_parent_data.replace(
        '0',
        workflowPk
      )
    ).done(function (response: WorkflowParentDataQueryResp) {
      if (response.action === VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

// @todo combine these
//Get the public data from all parent workflows
export function getPublicWorkflowParentDataQuery(
  workflowPk,
  callBackFunction = (_data: WorkflowParentDataQueryResp) =>
    console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.globalContextData.path.get_paths.get_public_workflow_parent_data.replace(
        '0',
        workflowPk
      )
    ).done(function (response: WorkflowParentDataQueryResp) {
      if (response.action === VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
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
    API_POST(
      COURSEFLOW_APP.globalContextData.path.post_paths.get_workflow_child_data,
      {
        nodePk: nodePk
      }
    ).then((response: WorkflowChildDataQueryResp) => {
      if (response.action == VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the public data from all child workflows,
// it looks like apart from permissions the differnce with this is just rate limitingh
export function getPublicWorkflowChildDataQuery(
  nodePk,
  callBackFunction = (_data: WorkflowChildDataQueryResp) =>
    console.log('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.globalContextData.path.get_paths.get_public_workflow_child_data.replace(
        '0',
        nodePk
      )
    ).done(function (response: WorkflowChildDataQueryResp) {
      if (response.action === VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
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
    API_POST(
      COURSEFLOW_APP.globalContextData.path.post_paths.get_workflow_context,
      {
        workflowPk: workflowPk
      }
    ).then((response: WorkflowContextQueryResp) => {
      if (response.action == VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Get possible projects that can be a target for the workflow to be duplicated into
 * @param workflowPk
 * @param callBackFunction
 */
export function getTargetProjectMenuQuery<T>(
  workflowPk: number,
  callBackFunction = (_data: TargetProjectQueryResp) => console.log('success')
) {
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.get_target_projects,
    {
      workflowPk: workflowPk
    }
  ).then((response: TargetProjectQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

/**
 * Get possible projects to add a workflow to
 * @param callBackFunction
 */
export function getProjectsForCreate<T>(
  callBackFunction = (_data: ProjectsForCreateQueryResp) =>
    console.log('success')
) {
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.get_projects_for_create,
    {}
  ).then((response: ProjectsForCreateQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

/**
 * Get all templates of a given type
 * @param callBackFunction
 */
export function getTemplates<T>(
  workflowType,
  callBackFunction = (_data: ProjectsForCreateQueryResp) =>
    console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.get_templates, {
    workflowType: workflowType
  }).then((response: ProjectsForCreateQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
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
      COURSEFLOW_APP.globalContextData.path.get_paths.get_public_parent_workflow_info.replace(
        '0',
        workflowPk
      )
    ).done(function (response: ParentWorkflowInfoQueryResp) {
      if (response.action === VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
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
    API_POST(
      COURSEFLOW_APP.globalContextData.path.post_paths.get_parent_workflow_info,
      {
        workflowPk: workflowPk
      }
    ).then((response: ParentWorkflowInfoQueryResp) => {
      if (response.action == VERB.POSTED) callBackFunction(response)
      else window.fail_function(response.action)
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
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.get_workflows_for_project,
    {
      projectPk: projectPk
    }
  ).then((response: WorkflowsForProjectQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

//@TODO this needs to be fixed to not rely on $.post
/**
 * Get the list of workflows we can link to a node
 *
 * endpoint: workflow/get-possible-linked-workflows
 *
 * @param nodeID
 * @param updateFunction
 * @param callBackFunction
 */
export function getLinkedWorkflowMenuQuery(
  nodeID,
  callBackFunction = (_data?: LinkedWorkflowMenuQueryResp) =>
    console.log('success')
) {
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths
      .get_possible_linked_workflows,
    {
      nodePk: nodeID
    }
  ).then((response: LinkedWorkflowMenuQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
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
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths
      .get_possible_added_workflows,
    {
      projectPk: projectPk,
      type_filter: type_filter,
      get_strategies: get_strategies,
      self_only: self_only
    }
    // (data) => {
    //   // @TODO call to react render
    //   receiptFunction(data)
    // }
  ).then((response: GetWorkflowSelectQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

/*******************************************************
 * DELETE AND ARCHIVE (restorable 'SOFT' DELETE with flag)
 *******************************************************/
export function archiveMutation(
  objectId: number,
  objectType: WorkSpaceType
): Promise<EmptyPostResp> {
  const url = COURSEFLOW_APP.globalContextData.path.post_paths.delete_self_soft

  return API_POST<EmptyPostResp>(url, {
    objectId: objectId,
    objectType: objectType
  })
}

//Causes the specified object to undelete itself
export function unarchiveSelfMutation(
  objectId: number,
  objectType: any
): Promise<EmptyPostResp> {
  return API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.restore_self,
    {
      objectId: objectId,
      objectType: objectType
    }
  )
}

export function deleteSelfHard(
  objectId: number,
  objectType: LibraryObjectType
): Promise<EmptyPostResp> {
  const url = COURSEFLOW_APP.globalContextData.path.post_paths.delete_self_soft

  return API_POST<EmptyPostResp>(url, {
    objectId: objectId,
    objectType: objectType
  })
}
