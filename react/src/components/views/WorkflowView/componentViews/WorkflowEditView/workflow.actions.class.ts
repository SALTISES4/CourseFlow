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

  static reorderArray(
    list: number[],
    startIndex: number,
    endIndex: number
  ): number[] {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return result
  }

  static swapInPlace<ArrayItemsType>(
    arr: ArrayItemsType[],
    from: number,
    to: number
  ): ArrayItemsType[] {
    const result = Array.from(arr)
    const clone = result[from]
    result[from] = result[to]
    result[to] = clone
    return result
  }
}

export default WorkflowFunctions
