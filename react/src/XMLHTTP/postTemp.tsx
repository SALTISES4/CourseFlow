//  TEMP FILE FOR AJAX FUNCTIONS UNTIL WE SOLVE CIRC DEPS
import { dragAction } from '@XMLHTTP/API/update'
import { VERB } from '@cfModule/types/enum'
import { renderMessageBox } from '@cfCommonComponents/menu/MenuComponents.jsx'

// import $ from 'jquery'




export function openWorkflowSelectMenu(response, updateFunction) {
  if (response.action === VERB.POSTED) {
    renderMessageBox(response, 'workflow_select_menu', updateFunction)
  } else {
    alert('Failed to find your workflows.')
  }
}



//Called when a node should have its column changed
export function columnChanged(selection_manager, objectID, columnID) {
  // @todo ?? dragAction is never defined outside this file
  if (!selection_manager.dragAction) selection_manager.dragAction = {}
  if (!selection_manager.dragAction['nodeweek']) selection_manager.dragAction['nodeweek'] = {}

  selection_manager.dragAction['nodeweek'] = {
    ...selection_manager.dragAction['nodeweek'],
    objectID: objectID,
    objectType: 'node',
    columnPk: columnID,
    columnChange: true
  }

  $(document).off('nodeweek-dropped')
  $(document).on('nodeweek-dropped', () => {
    dragAction(selection_manager.dragAction['nodeweek'])
    selection_manager.dragAction['nodeweek'] = null
    $(document).off('nodeweek-dropped')
  })
}

//Called when an object in a list is reordered
export function insertedAt(
  selection_manager,
  objectID,
  objectType,
  parentID,
  parentType,
  newPosition,
  throughType
) {
  if (!selection_manager.dragAction) selection_manager.dragAction = {}
  if (!selection_manager.dragAction[throughType]) selection_manager.dragAction[throughType] = {}
  selection_manager.dragAction[throughType] = {
    ...selection_manager.dragAction[throughType],
    objectID: objectID,
    objectType: objectType,
    parentID: parentID,
    parentType: parentType,
    newPosition: newPosition,
    throughType: throughType,
    inserted: true
  }
  $(document).off(throughType + '-dropped')
  if (objectID)
    $(document).on(throughType + '-dropped', () => {
      dragAction(selection_manager.dragAction[throughType])
      selection_manager.dragAction[throughType] = null
      $(document).off(throughType + '-dropped')
    })
}
