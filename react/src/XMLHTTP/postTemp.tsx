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
// @todo context has replaced renderer and so 'drag action' is not available
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
