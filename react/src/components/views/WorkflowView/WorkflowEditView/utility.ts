import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import { TColumn } from '@cfRedux/types/type'
import { TNode } from '@cfRedux/types/type'

export function getColumnColors(columns: TColumn[]): string[] {
  return columns.map((column) =>
    ThemeHelper.getColumnColour({
      columnType: column.columnType,
      colour: column.colour
    })
  )
}

// Applies some basic formatting to node's title
export function getNodeTitle(node: TNode): string {
  function calcTitle(): string {
    if (!node.representsWorkflow || !node.linkedWorkflowData) {
      return node.title
    }

    return [
      node.linkedWorkflowData.code || '',
      node.linkedWorkflowData.code && ' - ',
      node.linkedWorkflowData.title
    ].join()
  }

  return calcTitle() || _t('Untitled')
}

// Swaps the positions between two elements of an array
export function swapInPlace<ArrayItemsType>(
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
