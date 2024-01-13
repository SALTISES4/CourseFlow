//  TEMP FILE FOR AJAX FUNCTIONS UNTIL WE SOLVE CIRC DEPS
import { renderMessageBox } from '@cfCommonComponents/menu/MenuComponents.jsx'
import { DATA_ACTIONS } from './common'
import { dragAction } from '@XMLHTTP/PostFunctions.js'
// import $ from 'jquery'

/**
 *
 */
function openLinkedWorkflowMenu(response, updateFunction) {
  if (response.action === DATA_ACTIONS.POSTED) {
    renderMessageBox(response, 'linked_workflow_menu', updateFunction)
  } else {
    alert('Failed to find the parent project. Is this workflow in a project?')
  }
}

function openAddedWorkflowMenu(response, updateFunction) {
  if (response.action === DATA_ACTIONS.POSTED) {
    renderMessageBox(response, 'added_workflow_menu', updateFunction)
  } else {
    alert('Failed to find your workflows.')
  }
}

function openWorkflowSelectMenu(response, updateFunction) {
  if (response.action === DATA_ACTIONS.POSTED) {
    renderMessageBox(response, 'workflow_select_menu', updateFunction)
  } else {
    alert('Failed to find your workflows.')
  }
}

//Get a list of possible workflows we can add to this project
export function getAddedWorkflowMenu(
  projectPk,
  type_filter,
  get_strategies,
  self_only,
  updateFunction
) {
  $.post(
    COURSEFLOW_APP.config.post_paths.get_possible_added_workflows,
    {
      projectPk: JSON.stringify(projectPk),
      type_filter: JSON.stringify(type_filter),
      get_strategies: JSON.stringify(get_strategies),
      self_only: JSON.stringify(self_only)
    },
    (data) => {
      // @TODO call to react render
      //   openAddedWorkflowMenu(data, updateFunction)
    }
  )
}

//Get the workflows that can be selected for the project, shaped for a menu
export function getWorkflowSelectMenu(
  projectPk,
  type_filter,
  get_strategies,
  self_only,
  updateFunction,
  receiptFunction
) {
  $.post(
    COURSEFLOW_APP.config.post_paths.get_possible_added_workflows,
    {
      projectPk: JSON.stringify(projectPk),
      type_filter: JSON.stringify(type_filter),
      get_strategies: JSON.stringify(get_strategies),
      self_only: JSON.stringify(self_only)
    },
    (data) => {
      // @TODO call to react render
      //  openWorkflowSelectMenu(data, updateFunction)
      if (receiptFunction) receiptFunction()
    }
  )
}

//Called when a node should have its column changed
export function columnChanged(renderer, objectID, columnID) {
  // @todo ?? dragAction is never defined outside this file
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
    dragAction(renderer.dragAction['nodeweek'])
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
      dragAction(renderer.dragAction[throughType])
      renderer.dragAction[throughType] = null
      $(document).off(throughType + '-dropped')
    })
}
