//Get the data from all child workflows
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import {
  GetWorkflowByIdQueryResp,
  WorkflowChildDataQueryResp,
  WorkflowParentDataQueryResp
} from '@XMLHTTP/API/workflow.rtk'
import { API_POST } from '@XMLHTTP/CallWrapper'
import {
  ProjectsForCreateQueryResp,
  TargetProjectQueryResp
} from '@XMLHTTP/types/query'
import {
  GetWorkflowSelectQueryResp,
  LinkedWorkflowMenuQueryResp,
  ParentWorkflowInfoQueryResp
} from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

/*******************************************************
 * Bulk data API for workflows.
 * For loading all the base JSON that is placed into the
 * redux state.
 *******************************************************/

// @todo combine these
//Get the public data from the workflow
export function getPublicWorkflowDataQuery(
  id,
  callBackFunction = (_data: GetWorkflowByIdQueryResp) =>
    Utility.logger('success')
) {
  const base = apiPaths.json_api.workflow.public__detail
  const url = generatePath(base, { id })

  try {
    $.get(url).done(function (response: GetWorkflowByIdQueryResp) {
      callBackFunction(response)
    })
  } catch (err) {
    Utility.logger(err)
  }
}

//Get the data from all parent workflows
export function getWorkflowParentDataQuery(
  id: number
): Promise<WorkflowParentDataQueryResp> {
  const base = apiPaths.json_api.workflow.parent__detail
  const url = generatePath(base, { id })
  return API_POST<WorkflowParentDataQueryResp>(url, {
    workflowPk: id
  })
}

// @todo combine these
//Get the public data from all parent workflows
export function getWorkflowParentDataQueryLegacy(
  id,
  callBackFunction = (_data: WorkflowParentDataQueryResp) =>
    Utility.logger('success')
) {
  const base = apiPaths.json_api.workflow.public__parent__detail
  const url = generatePath(base, { id })
  try {
    $.get(url).done(function (response: WorkflowParentDataQueryResp) {
      callBackFunction(response)
    })
  } catch (err) {
    Utility.logger(err)
  }
}

// @todo combine these
//Get the public data from all parent workflows
export function getPublicWorkflowParentDataQuery(
  id,
  callBackFunction = (_data: WorkflowParentDataQueryResp) =>
    Utility.logger('success')
) {
  const base = apiPaths.json_api.workflow.public__parent__detail
  const url = generatePath(base, { id })
  try {
    $.get(url).done(function (response: WorkflowParentDataQueryResp) {
      callBackFunction(response)
    })
  } catch (err) {
    Utility.logger(err)
  }
}

export function getWorkflowChildDataQuery(
  nodePk,
  callBackFunction = (_data: WorkflowChildDataQueryResp) =>
    Utility.logger('success')
) {
  const url = apiPaths.json_api.workflow.child__detail
  try {
    API_POST(url, {
      nodePk: nodePk
    }).then((response: WorkflowChildDataQueryResp) => {
      callBackFunction(response)
    })
  } catch (err) {
    Utility.logger(err)
  }
}

//Get the public data from all child workflows,
// it looks like apart from permissions the differnce with this is just rate limitingh
export function getPublicWorkflowChildDataQuery(
  nodeId: number,
  callBackFunction = (_data: WorkflowChildDataQueryResp) =>
    Utility.logger('success')
) {
  try {
    const base = apiPaths.json_api.workflow.public__child__detail
    const url = generatePath(base, { id: nodeId })

    $.get(url).done(function (response: WorkflowChildDataQueryResp) {
      callBackFunction(response)
    })
  } catch (err) {
    Utility.logger(err)
  }
}

/**
 * Get possible projects that can be a target for the workflow to be duplicated into
 * @param workflowPk
 * @param callBackFunction
 */
export function getTargetProjectMenuQuery<T>(
  workflowPk: number,
  callBackFunction = (_data: TargetProjectQueryResp) =>
    Utility.logger('success')
) {
  const url = apiPaths.json_api.project.list__by_current_user
  API_POST(url, {
    workflowPk: workflowPk
  }).then((response: TargetProjectQueryResp) => {
    callBackFunction(response)
  })
}

/**
 * Get all templates of a given type
 * @param callBackFunction
 */
export function getTemplates<T>(
  workflowType,
  callBackFunction = (_data: ProjectsForCreateQueryResp) =>
    Utility.logger('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.get_templates, {
    workflowType: workflowType
  }).then((response: ProjectsForCreateQueryResp) => {
    callBackFunction(response)
  })
}

//Get the public data from the workflow
export function getPublicParentWorkflowInfo(
  workflowPk,
  callBackFunction = (_data: ParentWorkflowInfoQueryResp) =>
    Utility.logger('success')
) {
  try {
    $.get(
      COURSEFLOW_APP.globalContextData.path.get_paths.get_public_parentWorkflow_info.replace(
        '0',
        workflowPk
      )
    ).done(function (response: ParentWorkflowInfoQueryResp) {
      callBackFunction(response)
    })
  } catch (err) {
    Utility.logger(err)
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
// export function getParentWorkflowInfoQuery(workflowPk: number): Promise<any> {
//   const base = apiPaths.json_api.workflow.parent__detail__full
//   const url = generatePath(base, { id: workflowPk })
//   return API_GET<any>(url)
// }

/**
 * @getWorkflowsForProjectQuery
 *
 *
 *
 * Get the workflows for a project
 * @param projectPk
 * @param callBackFunction
 */
// export function getWorkflowsForProjectQuery(
//   projectPk,
//   callBackFunction = (_data: WorkflowsForProjectQueryResp) =>
//     Utility.logger('success')
// ) {
//   const url = apiPaths.json_api.project.workflows__list
//   API_POST(url, {
//     projectPk: projectPk
//   }).then((response: WorkflowsForProjectQueryResp) => {
//     callBackFunction(response)
//   })
// }

//@TODO this needs to be fixed to not rely on $.post
/**
 * Get the list of workflows we can link to a node
 *
 * endpoint: workflow/get-possible-linked-workflows
 *
 * @param nodeId
 * @param updateFunction
 * @param callBackFunction
 */
export function getLinkedWorkflowMenuQuery(
  nodeId,
  callBackFunction = (_data?: LinkedWorkflowMenuQueryResp) =>
    Utility.logger('success')
) {
  const url = apiPaths.json_api.workflow.list__possible_linked
  API_POST(url, {
    nodePk: nodeId
  }).then((response: LinkedWorkflowMenuQueryResp) => {
    callBackFunction(response)
  })
}

/**
 * Get the workflows that can be selected for the project, shaped for a menu
 * @param projectPk
 * @param typeFilter
 * @param getStrategies
 * @param selfOnly
 * @param callBackFunction
 */
export function getWorkflowSelectMenuQuery(
  projectPk: number,
  typeFilter: CfObjectType,
  getStrategies: boolean,
  selfOnly: boolean,
  callBackFunction: (_data: GetWorkflowSelectQueryResp) => void
  // updateFunction,
  //  receiptFunction
) {
  const url = apiPaths.json_api.workflow.list__possible_added
  API_POST(
    url,
    {
      projectPk: projectPk,
      typeFilter: typeFilter,
      getStrategies: getStrategies,
      selfOnly: selfOnly
    }
    // (data) => {
    //   // @TODO call to react render
    //   receiptFunction(data)
    // }
  ).then((response: GetWorkflowSelectQueryResp) => {
    callBackFunction(response)
  })
}
