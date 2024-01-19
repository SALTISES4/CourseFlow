//get assignment data
import {ToDefine, VERB} from '@cfModule/types/common'

export function getAssignmentDataQuery(
  liveassignmentPk,
  data_type,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_assignment_data, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      console.log('getAssignmentDataQuery data')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//get assignment data
export function getAssignmentDataStudent(
  liveassignmentPk,
  data_type,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_assignment_data_student, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      console.log('getAssignmentDataStudent data')
      console.log(data)
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//get nodes for the workflow
export function createAssignmentQuery(
  nodePk,
  liveprojectPk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.create_live_assignment, {
      nodePk: JSON.stringify(nodePk),
      liveprojectPk: JSON.stringify(liveprojectPk)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

export function setAssignmentCompletionQuery(
  userassignmentPk,
  completed,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.set_assignment_completion, {
      userassignmentPk: JSON.stringify(userassignmentPk),
      completed: JSON.stringify(completed)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

export function getAssignmentsForNode(
  nodePk,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_assignments_for_node, {
      nodePk: JSON.stringify(nodePk)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//add or remove users to/from assignment
export function addUsersToAssignmentQuery(
  liveassignmentPk,
  user_list,
  add,
  callBackFunction = (_data: ToDefine) => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.add_users_to_assignment, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      user_list: JSON.stringify(user_list),
      add: JSON.stringify(add)
    }).done(function (data) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}
