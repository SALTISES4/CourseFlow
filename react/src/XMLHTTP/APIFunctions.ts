import {
  DuplicateBaseItemQueryResp,
  HomeQueryResp,
  LibraryQueryResp,
  SearchAllObjectsQueryResp,
  UsersForObjectQueryResp,
  WorkflowsForProjectQueryResp
} from '@XMLHTTP/types'
import { DATA_ACTIONS, OBJECT_TYPE } from '@XMLHTTP/common'

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
      console.log('data')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    console.log('err')
    console.log(err)
    window.fail_function()
  }
}

//Duplicate a project workflow, strategy, or outcome
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

export default {}
