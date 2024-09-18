//  TEMP FILE FOR AJAX FUNCTIONS UNTIL WE SOLVE CIRC DEPS
import { renderMessageBox } from '@cfComponents/__LEGACY/menuLegacy/MenuComponents.jsx'
import { dragAction } from '@XMLHTTP/API/update'

// import $ from 'jquery'

export function openWorkflowSelectMenu(response, updateFunction) {
  renderMessageBox(response, 'workflow_select_menu', updateFunction)
}

//Called when a node should have its column changed
export function columnChanged(selectionManager, objectId, columnID) {
  // @todo ?? dragAction is never defined outside this file
  if (!selectionManager.dragAction) selectionManager.dragAction = {}
  if (!selectionManager.dragAction['nodeweek'])
    selectionManager.dragAction['nodeweek'] = {}

  selectionManager.dragAction['nodeweek'] = {
    ...selectionManager.dragAction['nodeweek'],
    objectId: objectId,
    objectType: 'node',
    columnPk: columnID,
    columnChange: true
  }

  $(document).off('nodeweek-dropped')
  $(document).on('nodeweek-dropped', () => {
    dragAction(selectionManager.dragAction['nodeweek'])
    selectionManager.dragAction['nodeweek'] = null
    $(document).off('nodeweek-dropped')
  })
}

//Called when an object in a list is reordered
export function insertedAt(
  selectionManager,
  objectId,
  objectType,
  parentID,
  parentType,
  newPosition,
  throughType
) {
  if (!selectionManager.dragAction) selectionManager.dragAction = {}
  if (!selectionManager.dragAction[throughType])
    selectionManager.dragAction[throughType] = {}
  selectionManager.dragAction[throughType] = {
    ...selectionManager.dragAction[throughType],
    objectId: objectId,
    objectType: objectType,
    parentID: parentID,
    parentType: parentType,
    newPosition: newPosition,
    throughType: throughType,
    inserted: true
  }
  $(document).off(throughType + '-dropped')
  if (objectId)
    $(document).on(throughType + '-dropped', () => {
      dragAction(selectionManager.dragAction[throughType])
      selectionManager.dragAction[throughType] = null
      $(document).off(throughType + '-dropped')
    })
}
