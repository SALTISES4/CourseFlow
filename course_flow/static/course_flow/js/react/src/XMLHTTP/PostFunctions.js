import { changeField } from '../redux/Reducers.js'
import * as Constants from '../Constants.js'
import { DATA_ACTIONS } from './common.js'

/*
All functions for API calls.
// @todo rename this file to 'XMLHttp' or 'ajax' etc (not just doing POST requests)
// @todo intermixed calls to DOM via jQuery
*/

// JQUERY
export function fail_function(a, b, c, d) {
  if (typeof a === 'string') {
    alert(b)
    alert(
      a +
        ' - ' +
        window.gettext('Something went wrong. Please reload the page.')
    )
  } else if (a && a.type === 'ajaxError') {
    if (b.status === 429) {
      alert(
        window.gettext(
          'Too many requests from your IP address. Please wait and try again later.'
        )
      )
    } else if (b.status === 403 || b.status === 401 || b.status === 500) {
      alert(b.status + ' ' + window.gettext('error at ') + ' ' + c.url)
    } else
      alert(
        a +
          b.status +
          c +
          window.gettext('final Something went wrong. Please reload the page.')
      )
  } else {
    alert(
      a +
        b.status +
        c +
        window.gettext('final Something went wrong. Please reload the page.')
    )
  }
}

//get the workflow's context data
export function getWorkflowContext(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_workflow_context, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Set the linked workflow for the node
export function setLinkedWorkflow(
  node_id,
  workflow_id,
  callBackFunction = () => console.log('success')
) {
  $.post(window.config.post_paths.set_linked_workflow, {
    nodePk: node_id,
    workflowPk: workflow_id
  }).done(function (data) {
    if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
    else fail_function(data.action)
  })
}

//Update the value of an object in database. JSON may be partial. Debounced in case the user is typing a lot.
export function updateValue(
  objectID,
  objectType,
  json,
  changeField = false,
  callBackFunction = () => console.log('success')
) {
  var t = 1000
  let previousCall = document.lastUpdateCall
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
  let post_object = {
    objectID: JSON.stringify(objectID),
    objectType: JSON.stringify(objectType),
    data: JSON.stringify(json)
  }
  if (changeField) post_object.changeFieldID = changeFieldID
  else post_object.changeFieldID = 0
  document.lastUpdateCallFunction = () => {
    try {
      $.post(window.config.post_paths.update_value, post_object).done(
        function (data) {
          if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
          else fail_function(data.action)
        }
      )
    } catch (err) {
      fail_function()
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
    $.post(window.config.post_paths.update_value, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      data: JSON.stringify(json)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Toggles whether or not an object is dropped. No longer sent to database.
export function toggleDrop(
  objectID,
  objectType,
  is_dropped,
  dispatch,
  depth = 1
) {
  try {
    let default_drop = Constants.get_default_drop_state(
      objectID,
      objectType,
      depth
    )
    if (is_dropped !== default_drop)
      window.localStorage.setItem(objectType + objectID, is_dropped)
    else window.localStorage.removeItem(objectType + objectID)
  } catch (err) {
    if (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ) {
      window.localStorage.clear()
    }
  }
  dispatch(changeField(objectID, objectType, { is_dropped: is_dropped }))
}

//Add a new node to a week
export function newNode(
  weekPk,
  position = -1,
  column = -1,
  column_type = -1,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.new_node, {
      weekPk: JSON.stringify(weekPk),
      position: JSON.stringify(position),
      columnPk: JSON.stringify(column),
      columnType: JSON.stringify(column_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Add a new outcome to a workflow
export function newOutcome(
  workflowPk,
  object_set_id,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.new_outcome, {
      workflowPk: JSON.stringify(workflowPk),
      objectsetPk: JSON.stringify(object_set_id)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Create a nodelink from the source to the target, at the given ports
export function newNodeLink(
  source_node,
  target_node,
  source_port,
  target_port,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.new_node_link, {
      nodePk: JSON.stringify(source_node),
      objectID: JSON.stringify(target_node),
      objectType: JSON.stringify('node'),
      sourcePort: JSON.stringify(source_port),
      targetPort: JSON.stringify(target_port)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Add a strategy to the workflow
export function addStrategy(
  workflowPk,
  position = -1,
  strategyPk = -1,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.add_strategy, {
      workflowPk: JSON.stringify(workflowPk),
      position: JSON.stringify(position),
      objectID: JSON.stringify(strategyPk),
      objectType: JSON.stringify('workflow')
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}
//Turn a week into a strategy or vice versa
export function toggleStrategy(
  weekPk,
  is_strategy,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.toggle_strategy, {
      weekPk: JSON.stringify(weekPk),
      is_strategy: JSON.stringify(is_strategy)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Causes the specified object to delete itself
export function deleteSelf(
  objectID,
  objectType,
  soft = false,
  callBackFunction = () => console.log('success')
) {
  let path
  if (soft) path = window.config.post_paths.delete_self_soft
  else path = window.config.post_paths.delete_self

  try {
    $.post(path, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Causes the specified object to delete itself
export function deleteSelfLive(
  objectID,
  objectType,
  callBackFunction = () => console.log('success')
) {
  let path = window.config.post_paths.delete_self_live
  try {
    $.post(path, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Causes the specified object to undelete itself
export function restoreSelf(
  objectID,
  objectType,
  callBackFunction = () => console.log('success')
) {
  let path
  try {
    $.post(window.config.post_paths.restore_self, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Removes the specified comment from the object
export function removeComment(
  objectID,
  objectType,
  commentPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.remove_comment, {
      objectID: JSON.stringify(objectID),
      commentPk: JSON.stringify(commentPk),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Removes all comments from the object
export function removeAllComments(
  objectID,
  objectType,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.remove_all_comments, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Causes the specified throughmodel to update its degree
export function updateOutcomenodeDegree(
  nodeID,
  outcomeID,
  value,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.update_outcomenode_degree, {
      nodePk: JSON.stringify(nodeID),
      outcomePk: JSON.stringify(outcomeID),
      degree: JSON.stringify(value)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Causes the specified object to insert a sibling after itself
export function duplicateSelf(
  objectID,
  objectType,
  parentID,
  parentType,
  throughType,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.duplicate_self, {
      parentID: JSON.stringify(parentID),
      parentType: JSON.stringify(parentType),
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      throughType: JSON.stringify(throughType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}
//Causes the specified object to insert a sibling after itself
export function insertSibling(
  objectID,
  objectType,
  parentID,
  parentType,
  throughType,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.insert_sibling, {
      parentID: JSON.stringify(parentID),
      parentType: JSON.stringify(parentType),
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      throughType: JSON.stringify(throughType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Causes the specified object to insert a child to itself
export function insertChild(
  objectID,
  objectType,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.insert_child, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Called when a node should have its column changed
export function columnChanged(renderer, objectID, columnID) {
  if (!renderer.dragAction) renderer.dragAction = {}
  if (!renderer.dragAction['nodeweek']) renderer.dragAction['nodeweek'] = {}
  renderer.dragAction['nodeweek'] = {
    ...renderer.dragAction['nodeweek'],
    objectID: JSON.stringify(objectID),
    objectType: JSON.stringify('node'),
    columnPk: JSON.stringify(columnID),
    columnChange: JSON.stringify(true)
  }
  $(document).off('nodeweek-dropped')
  $(document).on('nodeweek-dropped', () => {
    dragAction(renderer, renderer.dragAction['nodeweek'])
    renderer.dragAction['nodeweek'] = null
    $(document).off('nodeweek-dropped')
  })
}

//Called when an object in a list is reordered
export function insertedAt(
  renderer,
  objectID,
  objectType,
  parentID,
  parentType,
  newPosition,
  throughType
) {
  if (!renderer.dragAction) renderer.dragAction = {}
  if (!renderer.dragAction[throughType]) renderer.dragAction[throughType] = {}
  renderer.dragAction[throughType] = {
    ...renderer.dragAction[throughType],
    objectID: JSON.stringify(objectID),
    objectType: JSON.stringify(objectType),
    parentID: JSON.stringify(parentID),
    parentType: JSON.stringify(parentType),
    newPosition: JSON.stringify(newPosition),
    throughType: JSON.stringify(throughType),
    inserted: JSON.stringify(true)
  }
  $(document).off(throughType + '-dropped')
  if (objectID)
    $(document).on(throughType + '-dropped', () => {
      dragAction(renderer, renderer.dragAction[throughType])
      renderer.dragAction[throughType] = null
      $(document).off(throughType + '-dropped')
    })
}

//When the drag is complete, this is called to actually update the back-end
export function dragAction(
  renderer,
  action_data,
  callBackFunction = () => console.log('success')
) {
  try {
    renderer.tiny_loader.startLoad()
    $('.ui-draggable').draggable('disable')
    $.post(window.config.post_paths.inserted_at, action_data).done(
      function (data) {
        if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
        else fail_function(data.action)
        $('.ui-draggable').draggable('enable')
        renderer.tiny_loader.endLoad()
      }
    )
  } catch (err) {
    fail_function('The item failed to be inserted.')
    console.log(err)
  }
}

//Called when an object in a list is reordered
export function insertedAtInstant(
  renderer,
  objectID,
  objectType,
  parentID,
  parentType,
  newPosition,
  throughType,
  callBackFunction = () => console.log('success')
) {
  try {
    renderer.tiny_loader.startLoad()
    $('.ui-draggable').draggable('disable')
    $.post(window.config.post_paths.inserted_at, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      parentID: JSON.stringify(parentID),
      parentType: JSON.stringify(parentType),
      newPosition: JSON.stringify(newPosition),
      throughType: JSON.stringify(throughType),
      inserted: JSON.stringify(true),
      allowDifferent: JSON.stringify(true)
    }).done(function (data) {
      if (data.action === 'posted') callBackFunction(data)
      else fail_function(data.action)
      $('.ui-draggable').draggable('enable')
      renderer.tiny_loader.endLoad()
    })
  } catch (err) {
    fail_function('The item failed to be inserted.')
    console.log(err)
  }
}
//Add an outcome from the parent workflow to an outcome from the current one
export function updateOutcomehorizontallinkDegree(
  outcomePk,
  outcome2Pk,
  degree,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.update_outcomehorizontallink_degree, {
      outcomePk: JSON.stringify(outcomePk),
      objectID: JSON.stringify(outcome2Pk),
      objectType: JSON.stringify('outcome'),
      degree: JSON.stringify(degree)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Add an outcome to a node
export function toggleFavourite(
  objectID,
  objectType,
  favourite,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.toggle_favourite, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      favourite: JSON.stringify(favourite)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Duplicate a project workflow, strategy, or outcome
export function duplicateBaseItem(
  itemPk,
  objectType,
  projectID,
  callBackFunction = () => console.log('success')
) {
  try {
    if (objectType === OBJECT_TYPE.PROJECT) {
      $.post(window.config.post_paths.duplicate_project_ajax, {
        projectPk: JSON.stringify(itemPk)
      }).done(function (data) {
        if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
        else fail_function(data.action)
      })
    } else if (objectType === OBJECT_TYPE.OUTCOME) {
      $.post(window.config.post_paths.duplicate_outcome_ajax, {
        outcomePk: JSON.stringify(itemPk),
        projectPk: JSON.stringify(projectID)
      }).done(function (data) {
        if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
        else fail_function(data.action)
      })
    } else if (!projectID && projectID !== 0) {
      $.post(window.config.post_paths.duplicate_strategy_ajax, {
        workflowPk: JSON.stringify(itemPk)
      }).done(function (data) {
        if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
        else fail_function(data.action)
      })
    } else {
      $.post(window.config.post_paths.duplicate_workflow_ajax, {
        workflowPk: JSON.stringify(itemPk),
        projectPk: JSON.stringify(projectID)
      }).done(function (data) {
        if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
        else fail_function(data.action)
      })
    }
  } catch (err) {
    fail_function()
  }
}

//Get the data from the workflow
export function getWorkflowData(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_workflow_data, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the data from all parent workflows
export function getWorkflowParentData(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_workflow_parent_data, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the data from all child workflows
export function getWorkflowChildData(
  nodePk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_workflow_child_data, {
      nodePk: JSON.stringify(nodePk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the public data from the workflow
export function getPublicWorkflowData(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.get(
      window.config.get_paths.get_public_workflow_data.replace('0', workflowPk)
    ).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the public data from all parent workflows
export function getPublicWorkflowParentData(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.get(
      window.config.get_paths.get_public_workflow_parent_data.replace(
        '0',
        workflowPk
      )
    ).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the public data from all child workflows
export function getPublicWorkflowChildData(
  nodePk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.get(
      window.config.get_paths.get_public_workflow_child_data.replace(
        '0',
        nodePk
      )
    ).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the list of possible disciplines
export function getDisciplines(
  callBackFunction = () => console.log('success')
) {
  try {
    $.get(window.config.get_paths.get_disciplines).done(function (data) {
      callBackFunction(data)
    })
  } catch (err) {
    fail_function()
  }
}

//set the permission for a user
export function setUserPermission(
  user_id,
  objectID,
  objectType,
  permission_type,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.set_permission, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      permission_user: JSON.stringify(user_id),
      permission_type: JSON.stringify(permission_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.error)
    })
  } catch (err) {
    fail_function()
  }
}

//set the permission for a user
export function setLiveProjectRole(
  user_id,
  liveprojectPk,
  permission_type,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.set_liveproject_role, {
      liveprojectPk: JSON.stringify(liveprojectPk),
      permission_user: JSON.stringify(user_id),
      role_type: JSON.stringify(permission_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.error)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the list of users for a project
export function getUsersForObject(
  objectID,
  objectType,
  callBackFunction = () => console.log('success')
) {
  if (['program', 'course', 'activity'].indexOf(objectType) >= 0)
    objectType = 'workflow'
  try {
    $.post(window.config.post_paths.get_users_for_object, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}
//Get the list of users for a liveproject
export function getUsersForLiveProject(
  liveprojectPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_users_for_liveproject, {
      liveprojectPk: JSON.stringify(liveprojectPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get a list of users, filtered by name
export function getUserList(
  filter,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_user_list, {
      filter: JSON.stringify(filter)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the comments for a particular object
export function getCommentsForObject(
  objectID,
  objectType,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_comments_for_object, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//add a comment to an object
export function addComment(
  objectID,
  objectType,
  text,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.add_comment, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      text: JSON.stringify(text)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//add a comment to an object
export function addTerminology(
  projectPk,
  term,
  title,
  translation_plural,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.add_terminology, {
      projectPk: JSON.stringify(projectPk),
      term: JSON.stringify(term),
      title: JSON.stringify(title),
      translation_plural: JSON.stringify(translation_plural)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//add a comment to an object
export function updateObjectSet(
  objectID,
  objectType,
  objectsetPk,
  add,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.update_object_set, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      objectsetPk: JSON.stringify(objectsetPk),
      add: JSON.stringify(add)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the info from the parent workflow
export function getParentWorkflowInfo(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_parent_workflow_info, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the public data from the workflow
export function getPublicParentWorkflowInfo(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.get(
      window.config.get_paths.get_public_parent_workflow_info.replace(
        '0',
        workflowPk
      )
    ).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//get exported data
export function getExport(
  objectID,
  objectType,
  exportType,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_export, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      exportType: JSON.stringify(exportType)
    }).done(function (data, status, xhr) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//create live project
export function makeProjectLive(
  projectPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.make_project_live, {
      projectPk: JSON.stringify(projectPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//set visibility of workflow
export function setWorkflowVisibility(
  liveprojectPk,
  workflowPk,
  visible,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.set_workflow_visibility, {
      liveprojectPk: JSON.stringify(liveprojectPk),
      workflowPk: JSON.stringify(workflowPk),
      visible: JSON.stringify(visible)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//get live project data
export function getLiveProjectData(
  projectPk,
  data_type,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_live_project_data, {
      liveprojectPk: JSON.stringify(projectPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//get live project data
export function getLiveProjectDataStudent(
  projectPk,
  data_type,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_live_project_data_student, {
      liveprojectPk: JSON.stringify(projectPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//get assignment data
export function getAssignmentData(
  liveassignmentPk,
  data_type,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_assignment_data, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//get assignment data
export function getAssignmentDataStudent(
  liveassignmentPk,
  data_type,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_assignment_data_student, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//get nodes for the workflow
export function getWorkflowNodes(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_workflow_nodes, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//get nodes for the workflow
export function createAssignment(
  nodePk,
  liveprojectPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.create_live_assignment, {
      nodePk: JSON.stringify(nodePk),
      liveprojectPk: JSON.stringify(liveprojectPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//add or remove users to/from assignment
export function addUsersToAssignment(
  liveassignmentPk,
  user_list,
  add,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.add_users_to_assignment, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      user_list: JSON.stringify(user_list),
      add: JSON.stringify(add)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

export function updateLiveProjectValue(
  objectID,
  objectType,
  json,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.update_liveproject_value, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      data: JSON.stringify(json)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

export function setAssignmentCompletion(
  userassignmentPk,
  completed,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.set_assignment_completion, {
      userassignmentPk: JSON.stringify(userassignmentPk),
      completed: JSON.stringify(completed)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

export function getAssignmentsForNode(
  nodePk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_assignments_for_node, {
      nodePk: JSON.stringify(nodePk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else fail_function(data.action)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the library projects
export function getLibrary(callBackFunction = () => console.log('success')) {
  try {
    $.get(window.config.get_paths.get_library).done(function (data) {
      callBackFunction(data)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the library projects
export function getFavourites(callBackFunction = () => console.log('success')) {
  try {
    $.get(window.config.get_paths.get_favourites).done(function (data) {
      callBackFunction(data)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the home projects
export function getHome(callBackFunction = () => console.log('success')) {
  try {
    $.get(window.config.get_paths.get_home).done(function (data) {
      callBackFunction(data)
    })
  } catch (err) {
    fail_function()
  }
}

//Get the workflows for a project
export function getWorkflowsForProject(
  projectPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.get_workflows_for_project, {
      projectPk: projectPk
    }).done(function (data) {
      callBackFunction(data)
    })
  } catch (err) {
    fail_function()
  }
}

//Search entire library
export function searchAllObjects(
  filter,
  data,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(window.config.post_paths.search_all_objects, {
      filter: JSON.stringify(filter),
      additional_data: JSON.stringify(data)
    }).done(function (data) {
      callBackFunction(data)
    })
  } catch (err) {
    fail_function()
  }
}
