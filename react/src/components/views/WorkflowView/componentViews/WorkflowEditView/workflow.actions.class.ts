import { dragAction } from '@XMLHTTP/API/update'

class WorkflowFunctions {
  static insertedAt(
    selectionManager,
    objectId,
    objectType,
    parentId,
    parentType,
    newPosition,
    throughType
  ) {
    console.log('inserted at')

    if (!selectionManager.dragAction) {
      selectionManager.dragAction = {}
    }
    if (!selectionManager.dragAction[throughType]) {
      selectionManager.dragAction[throughType] = {}
    }
    selectionManager.dragAction[throughType] = {
      ...selectionManager.dragAction[throughType],
      objectId: objectId,
      objectType: objectType,
      parentId: parentId,
      parentType: parentType,
      newPosition: newPosition,
      throughType: throughType,
      inserted: true
    }
    $(document).off(throughType + '-dropped')
    if (objectId) {
      $(document).on(throughType + '-dropped', () => {
        dragAction(selectionManager.dragAction[throughType])
        selectionManager.dragAction[throughType] = null
        $(document).off(throughType + '-dropped')
      })
    }
  }
}
