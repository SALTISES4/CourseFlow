import { DATA_ACTIONS } from './common'
// import $ from 'jquery'

/*
All functions for API calls.
// @todo rename this file to 'XMLHttp' or 'ajax' etc (not just doing POST requests)
// @todo intermixed calls to DOM via jQuery
*/

// Uses Fetch to POST data to a corresponding URL and
// interact with our "API" endpoints that fetch JSON data.
// Returns a Promise that can be then chained upon/consumed
// Rejects if the 'action' in JSON response hasn't 'posted'
// which can be caught and acted upon for error handling
export function API_POST(url = '', data = {}) {
  if (!url) {
    return Promise.reject('You need to specify an URL in for API_POST to run.')
  }

  return new Promise((res, rej) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'root' comes from the csrf-setup script
        'X-CSRFToken': window.getCsrfToken()
      },
      body: JSON.stringify(data)
    })
      // convert to JSON
      .then((response) => response.json())
      .then((data) => {
        // and if the action successfully posted, resolve the initial promise
        if (data.action === DATA_ACTIONS.POSTED) {
          res(data)
        } else {
          // otherwise reject with some potentially helpful info
          rej({ error: 'API_POST failed', url, data })
        }
      })
      // and finally reject if anything fishy is going on
      .catch((err) => {
        rej({ error: 'API_POST failed', originalError: err })
      })
  })
}

//get the workflow's context data
export function getWorkflowContext(
  workflowPk,
  callBackFunction = () => console.log('success')
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

//Set the linked workflow for the node
export function setLinkedWorkflow(
  node_id,
  workflow_id,
  callBackFunction = () => console.log('success')
) {
  $.post(COURSEFLOW_APP.config.post_paths.set_linked_workflow, {
    nodePk: node_id,
    workflowPk: workflow_id
  }).done(function (data) {
    if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
    else window.fail_function(data.action)
  })
}



//Create a nodelink from the source to the target, at the given ports
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
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.new_node_link, {
      nodePk: JSON.stringify(source_node),
      objectID: JSON.stringify(target_node),
      objectType: JSON.stringify('node'),
      sourcePort: JSON.stringify(source_port),
      targetPort: JSON.stringify(target_port)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}





//Causes the specified object to delete itself
export function deleteSelfLive(
  objectID,
  objectType,
  callBackFunction = () => console.log('success')
) {
  const path = COURSEFLOW_APP.config.post_paths.delete_self_live
  try {
    $.post(path, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
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
    $.post(COURSEFLOW_APP.config.post_paths.remove_comment, {
      objectID: JSON.stringify(objectID),
      commentPk: JSON.stringify(commentPk),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Removes all comments from the object
export function removeAllComments(
  objectID,
  objectType,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.remove_all_comments, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
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
    $.post(COURSEFLOW_APP.config.post_paths.update_outcomenode_degree, {
      nodePk: JSON.stringify(nodeID),
      outcomePk: JSON.stringify(outcomeID),
      degree: JSON.stringify(value)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}






//When the drag is complete, this is called to actually update the back-end
export function dragAction(
  action_data,
  callBackFunction = () => console.log('success')
) {
  try {
    COURSEFLOW_APP.tinyLoader.startLoad()
    $('.ui-draggable').draggable('disable')
    $.post(COURSEFLOW_APP.config.post_paths.inserted_at, action_data).done(
      function (data) {
        if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
        else window.fail_function(data.action)
        $('.ui-draggable').draggable('enable')
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  } catch (err) {
    window.fail_function('The item failed to be inserted.')
    console.log(err)
  }
}

//Called when an object in a list is reordered
export function insertedAtInstant(
  objectID,
  objectType,
  parentID,
  parentType,
  newPosition,
  throughType,
  callBackFunction = () => console.log('success')
) {
  try {
    COURSEFLOW_APP.tinyLoader.startLoad()
    $('.ui-draggable').draggable('disable')
    $.post(COURSEFLOW_APP.config.post_paths.inserted_at, {
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
      else window.fail_function(data.action)
      $('.ui-draggable').draggable('enable')
      COURSEFLOW_APP.tinyLoader.endLoad()
    })
  } catch (err) {
    window.fail_function('The item failed to be inserted.')
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
    $.post(
      COURSEFLOW_APP.config.post_paths.update_outcomehorizontallink_degree,
      {
        outcomePk: JSON.stringify(outcomePk),
        objectID: JSON.stringify(outcome2Pk),
        objectType: JSON.stringify('outcome'),
        degree: JSON.stringify(degree)
      }
    ).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
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
    $.post(COURSEFLOW_APP.config.post_paths.toggle_favourite, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      favourite: JSON.stringify(favourite)
    }).done(function (data) {
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
  callBackFunction = () => console.log('success')
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

//Get the data from all child workflows
export function getWorkflowChildDataQuery(
  nodePk,
  callBackFunction = () => console.log('success')
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

//Get the public data from the workflow
export function getPublicWorkflowDataQuery(
  workflowPk,
  callBackFunction = () => console.log('success')
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
  callBackFunction = () => console.log('success')
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
  callBackFunction = () => console.log('success')
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

//Get the list of possible disciplines
export function getDisciplines(
  callBackFunction = () => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_disciplines).done(
      function (data) {
        callBackFunction(data)
      }
    )
  } catch (err) {
    window.fail_function()
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
    $.post(COURSEFLOW_APP.config.post_paths.set_permission, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      permission_user: JSON.stringify(user_id),
      permission_type: JSON.stringify(permission_type)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.error)
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
  callBackFunction = () => console.log('success')
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

//Get the list of users for a liveproject
export function getUsersForLiveProject(
  liveprojectPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_users_for_liveproject, {
      liveprojectPk: JSON.stringify(liveprojectPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
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
    $.post(COURSEFLOW_APP.config.post_paths.add_comment, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      text: JSON.stringify(text)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
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
    $.post(COURSEFLOW_APP.config.post_paths.update_object_set, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      objectsetPk: JSON.stringify(objectsetPk),
      add: JSON.stringify(add)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the public data from the workflow
export function getPublicParentWorkflowInfo(
  workflowPk,
  callBackFunction = () => console.log('success')
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

//get exported data
export function getExport(
  objectID,
  objectType,
  exportType,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_export, {
      objectID: JSON.stringify(objectID),
      objectType: JSON.stringify(objectType),
      exportType: JSON.stringify(exportType)
    }).done(function (data, status, xhr) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//create live project
// @todo can this be removed ?
export function makeProjectLiveQuery(
  projectPk,
  callBackFunction = (data) => console.log('success')
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

//set visibility of workflow
// @todo can this be removed ?
export function setWorkflowVisibilityQuery(
  liveprojectPk,
  workflowPk,
  visible,
  callBackFunction = () => console.log('success')
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

//get live project data
// @todo can this be removed ?
export function getLiveProjectDataQuery(
  projectPk,
  data_type,
  callBackFunction = () => console.log('success')
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

//get live project data
// @todo can this be removed ?
export function getLiveProjectDataStudentQuery(
  projectPk,
  data_type,
  callBackFunction = () => console.log('success')
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

//get assignment data
export function getAssignmentDataQuery(
  liveassignmentPk,
  data_type,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_assignment_data, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      console.log('getAssignmentDataQuery data')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
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
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_assignment_data_student, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      data_type: JSON.stringify(data_type)
    }).done(function (data) {
      console.log('getAssignmentDataStudent data')
      console.log(data)
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//get nodes for the workflow
export function getWorkflowNodes(
  workflowPk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_workflow_nodes, {
      workflowPk: JSON.stringify(workflowPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
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
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.create_live_assignment, {
      nodePk: JSON.stringify(nodePk),
      liveprojectPk: JSON.stringify(liveprojectPk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
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
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.add_users_to_assignment, {
      liveassignmentPk: JSON.stringify(liveassignmentPk),
      user_list: JSON.stringify(user_list),
      add: JSON.stringify(add)
    }).done(function (data) {
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
  callBackFunction = () => console.log('success')
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

export function setAssignmentCompletionQuery(
  userassignmentPk,
  completed,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.set_assignment_completion, {
      userassignmentPk: JSON.stringify(userassignmentPk),
      completed: JSON.stringify(completed)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

export function getAssignmentsForNode(
  nodePk,
  callBackFunction = () => console.log('success')
) {
  try {
    $.post(COURSEFLOW_APP.config.post_paths.get_assignments_for_node, {
      nodePk: JSON.stringify(nodePk)
    }).done(function (data) {
      if (data.action === DATA_ACTIONS.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
  } catch (err) {
    window.fail_function()
  }
}

//Get the library projects
export function getFavouritesQuery(
  callBackFunction = () => console.log('success')
) {
  try {
    $.get(COURSEFLOW_APP.config.get_paths.get_favourites).done(function (data) {
      callBackFunction(data)
    })
  } catch (err) {
    window.fail_function()
  }
}
