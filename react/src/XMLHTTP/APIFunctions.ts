import {
  DuplicateBaseItemQueryResp,
  HomeQueryResp,
  LibraryQueryResp,
  SearchAllObjectsQueryResp,
  SuccessPost,
  UsersForObjectQueryResp,
  WorkflowDataQueryResp,
  WorkflowsForProjectQueryResp
} from '@XMLHTTP/types'
import { DATA_ACTIONS, OBJECT_TYPE } from '@XMLHTTP/common'
import {
  LinkedWorkflowMenuQueryResp,
  ParentWorkflowInfoQueryResp
} from '@XMLHTTP/types/query'

/*******************************************************
 * LIBRARY PAGES
 *******************************************************/

/**
 * Get the library projects
 * @param callBackFunction
 */
export function getLibraryQuery(
  callBackFunction = (data: LibraryQueryResp) => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_library).done(function (
      data: LibraryQueryResp
    ) {
      callBackFunction(data)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Search entire library
 *
 * @param filter
 * @param data
 * @param callBackFunction
 */
export function searchAllObjectsQuery(
  filter,
  data,
  callBackFunction = (data: SearchAllObjectsQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.search_all_objects, {
      filter: JSON.stringify(filter),
      additional_data: JSON.stringify(data)
    }).done(function (data: SearchAllObjectsQueryResp) {
      callBackFunction(data)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * Get the home projects
 * @param callBackFunction
 */
export function getHomeQuery(
  callBackFunction = (data: HomeQueryResp) => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_home).done(function (
      data: HomeQueryResp
    ) {
      callBackFunction(data)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 *  @getUsersForObjectQuery
 *
 *  endpoint project/get-users-for-object/
 *
 *  Get the list of users for a project
 * @param objectID
 * @param objectType
 * @param callBackFunction
 */
export function getUsersForObjectQuery(
  objectID: number,
  objectType: string,
  callBackFunction = (data: UsersForObjectQueryResp) => console.log('success')
) {
  if (['program', 'course', 'activity'].indexOf(objectType) >= 0)
    objectType = 'workflow'
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_users_for_object, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data: UsersForObjectQueryResp) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    console.log('err')
    console.log(err)
    window.fail_function()
  }
}

/**
 *
 * @duplicateBaseItemQuery
 *
 *
 *
 * Duplicate a project workflow, strategy, or outcome
 *
 * @param itemPk
 * @param objectType
 * @param projectID
 * @param callBackFunction
 */
export function duplicateBaseItemQuery(
  itemPk: number,
  objectType: string,
  projectID: number,
  callBackFunction = (data: DuplicateBaseItemQueryResp) =>
    console.log('success')
) {
  const sendPostRequest = (url, data) => {
    $.post(url, data).done(function (response: DuplicateBaseItemQueryResp) {
      console.log('duplicateBaseItemQuery response')
      console.log(response)

      if (response.action === DATA_ACTIONS.POSTED) {
        callBackFunction(response)
      } else {
        window.fail_function(response.action)
      }
    })
  }

  try {
    const itemPkString = JSON.stringify(itemPk)
    const projectPkString = JSON.stringify(projectID)

    if (objectType === OBJECT_TYPE.PROJECT) {
      sendPostRequest(COURSEFLOW_APP.config.post_paths.duplicate_project_ajax, {
        projectPk: itemPkString
      })
    } else if (objectType === OBJECT_TYPE.OUTCOME) {
      sendPostRequest(COURSEFLOW_APP.config.post_paths.duplicate_outcome_ajax, {
        outcomePk: itemPkString,
        projectPk: projectPkString
      })
    } else if (objectType === OBJECT_TYPE.STRATEGY) {
      sendPostRequest(
        COURSEFLOW_APP.config.post_paths.duplicate_strategy_ajax,
        { workflowPk: itemPkString }
      )
    } else {
      sendPostRequest(
        COURSEFLOW_APP.config.post_paths.duplicate_workflow_ajax,
        { workflowPk: itemPkString, projectPk: projectPkString }
      )
    }
  } catch (err) {
    window.fail_function()
  }
}

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
  callBackFunction = (data: WorkflowsForProjectQueryResp) =>
    console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflows_for_project, {
      projectPk: projectPk
    }).done(function (data: WorkflowsForProjectQueryResp) {
      callBackFunction(data)
    })
  } catch (err) {
    window.fail_function()
  }
}

/**
 * @getWorkflowDataQuery
 *
 * endpoint: workflow/get-workflow-data/
 *
 * Get the data from the workflow
 * @param workflowPk
 * @param callBackFunction
 */
export function getWorkflowDataQuery(
  workflowPk,
  callBackFunction = (data: WorkflowDataQueryResp) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_data, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data: WorkflowDataQueryResp) {
      console.log('getWorkflowDataQuery data')
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
  callBackFunction = (data?: LinkedWorkflowMenuQueryResp) =>
    console.log('success')
) {
  $.post(
    COURSEFLOW_APP.config.post_paths.get_possible_linked_workflows,
    {
      nodePk: JSON.stringify(nodeData.id)
    },
    (data: LinkedWorkflowMenuQueryResp) => {
      callBackFunction()
      // @TODO call to react render
      //  openLinkedWorkflowMenu(data, updateFunction)
    }
  )
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
  callBackFunction = (data: ParentWorkflowInfoQueryResp) =>
    console.log('success')
) {
  try {
     console.log('workflowPk')
     console.log(workflowPk)
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
  console.log('MyError getParentWorkflowInfoQuery')
}

/*******************************************************
 * OUTCOME
 *******************************************************/
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
  callBackFunction = (data: SuccessPost) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.new_outcome, {
      workflowPk: JSON.stringify(workflowPk),
      objectsetPk: JSON.stringify(object_set_id)
    }).done(function (data: SuccessPost) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
export default {}

/*******************************************************
 * UPDATE
 *******************************************************/

//
/**
 * @updateValue
 * Update the value of an object in database. JSON may be partial. Debounced in case the user is typing a lot.
 *
 * endpoint: workflow/updatevalue/
 *
 * @param objectID
 * @param objectType
 * @param json
 * @param changeField
 * @param callBackFunction
 */
export function updateValueQuery(
  objectID,
  objectType,
  json,
  changeField = false,
  callBackFunction = () => console.log('success')
) {
  const t = 1000
  const previousCall = document.lastUpdateCall

  document.lastUpdateCall = {
    time: Date.now(),
    id: objectID,
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
    objectID: JSON.stringify(objectID),
    objectType: JSON.stringify(objectType),
    data: JSON.stringify(json),
    changeFieldID: 0
  }

  if (changeField) {
    // @ts-ignore
    post_object.changeFieldID = // @ts-ignore
      COURSEFLOW_APP.contextData.changeFieldID as number
  }

  document.lastUpdateCallFunction = () => {
    try {
      $.post(COURSEFLOW_APP.config.post_paths.update_value, post_object).done(
        function (data) {
          // @ts-ignore
          if (data.action === DATA_ACTIONS.POSTED) {
            // @ts-ignore
            callBackFunction(data)
          } else window.fail_function(data.action)
        }
      )
    } catch (err) {
      window.fail_function()
    }
  }
  document.lastUpdateCallTimer = setTimeout(document.lastUpdateCallFunction, t)
}

//As above, but not debounced
export function updateValueInstant(
  objectID,
  objectType,
  json,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.update_value, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      data: JSON.stringify(json)
    }).done(function (data) {
      // @ts-ignore
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
