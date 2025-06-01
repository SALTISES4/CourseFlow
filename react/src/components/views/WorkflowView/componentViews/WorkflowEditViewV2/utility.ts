import { TColumn, TWeek, TWorkflow } from '@cf/redux/types/type'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import { TNode } from '@cfRedux/types/type'

import { WeekCellNodeType } from './components/WeekCell/types'
import type { BoardType, BoardWeekRowType } from './types'

// Parses workflow week/column data to prepare part grid data beforehand
// so it all comes from the parent view and trickles down into children
// instead of various children having to pull data when they are rendered
export function getWorkflowBoardData(
  workflow: TWorkflow,
  nodes: TNode[],
  weeksMap: Record<string, TWeek>
): BoardType {
  const { weeks, columns } = workflow

  const weeksData = weeks.map((weekId) => {
    const weekNodes = weeksMap[weekId].nodes

    // Create phantom nodes if initially empty
    if (!weekNodes.length) {
      const row: BoardWeekRowType = new Array(columns.length).fill(
        WeekCellNodeType.PHANTOM
      )
      return { id: weekId, rows: [row] }
    }

    // else, every node is on its own row and associated to a single column ID
    const rows = weekNodes.map((nodeId, index) => {
      const rowArr: BoardWeekRowType = new Array(columns.length).fill(
        WeekCellNodeType.PHANTOM
      )

      const nodeData = nodes.find((n) => n.id === nodeId)
      const nodeColumnIndex = columns.indexOf(nodeData.column)

      // prepare node data beforehand
      rowArr[nodeColumnIndex] = {
        id: nodeData.id,
        title: getNodeTitle(nodeData),
        description: nodeData.description,
        column: nodeData.column,
        hasAutoLink: nodeData.hasAutolink,
        outgoingLinks: nodeData.outgoingLinks,
        contextType: nodeData.contextClassification,
        taskType: nodeData.taskClassification,
        time: {
          length: nodeData.timeRequired,
          unit: nodeData.timeUnits
        }
      }

      return rowArr
    })

    return { id: weekId, rows }
  })

  return weeksData
}

export function getColumnColors(
  columns: {
    column: TColumn
    siblingCount: number
    columns: number[]
  }[]
): string[] {
  return columns.map((columnData) =>
    ThemeHelper.getColumnColour({
      columnType: columnData.column.columnType,
      colour: columnData.column.colour
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
