// @todo can this be removed ?
import { DATA_ACTIONS } from '@XMLHTTP/common'
import { ToDefine } from '@cfModule/types/common'
import { renderMessageBox } from '@cfCommonComponents/menu/MenuComponents'

export function getLiveProjectDataStudentQuery(
  projectPk,
  data_type,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_live_project_data_student, {
      liveprojectPk: JSON.stringify(projectPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      console.log('getLiveProjectDataStudentQuery data')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

// @todo can this be removed ?
export function updateLiveProjectValueQuery(
  objectID,
  objectType,
  json,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.update_liveproject_value, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      data: JSON.stringify(json)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
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
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  $.post(
    COURSEFLOW_APP.config.post_paths.get_target_projects,
    {
      workflowPk: JSON.stringify(workflowPk)
    },
    (data) => {
      // @ts-ignore
      callBackFunction()
      // @TODO call to react render
      openTargetProjectMenu(data, updateFunction)
    }
  )
}

function openTargetProjectMenu(response, updateFunction) {
  if (response.action === DATA_ACTIONS.POSTED) {
    renderMessageBox(response, 'target_project_menu', updateFunction)
  } else {
    alert('Failed to find potential projects.')
  }
}

//create live project
// @todo can this be removed ?
export function makeProjectLiveQuery(
  projectPk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.make_project_live, {
      projectPk: JSON.stringify(projectPk)
    }).done(function (data) {
      console.log('makeProjectLiveQuery data')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//get live project data
// @todo can this be removed ?
export function getLiveProjectDataQuery(
  projectPk,
  data_type,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_live_project_data, {
      liveprojectPk: JSON.stringify(projectPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      console.log('getLiveProjectDataQuery data')
      console.log(data)

      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//set the permission for a user
export function setLiveProjectRole(
  user_id,
  liveprojectPk,
  permission_type,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.set_liveproject_role, {
      liveprojectPk: JSON.stringify(liveprojectPk),
      permission_user: JSON.stringify(user_id),
      role_type: JSON.stringify(permission_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.error)
    })
  } catch (err) {
    window.fail_function()
  }
}
