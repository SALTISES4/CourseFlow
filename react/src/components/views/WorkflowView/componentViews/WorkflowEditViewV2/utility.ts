import { selectNodeById } from '@cf/redux/selectors/node.selector'
import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { AppState, TWorkflow } from '@cf/redux/types/type'
import { _t } from '@cf/utility/Utility.class'
import { TNode } from '@cfRedux/types/type'
import { useSelector } from 'react-redux'

import type { BoardType, BoardWeekRowType } from './types'

// Parses workflow week/column data to prepare part grid data beforehand
// so it all comes from the parent view and trickles down into children
// instead of various children having to pull data when they are rendered
export function getWorkflowBoardData(workflow: TWorkflow): BoardType {
  const { weeks, columns } = workflow

  const weeksData = weeks.map((weekId) => {
    const weekData = useSelector((appState: AppState) =>
      selectWeekById(appState, weekId)
    )

    const weekNodes = weekData.week.nodes
    // Create phantom nodes if initially empty
    if (!weekNodes.length) {
      const row: BoardWeekRowType = new Array(columns.length).fill('phantom')
      return { id: weekId, rows: [row] }
    }

    // else, every node is on its own row and associated to a single column ID
    const rows = weekNodes.map((nodeId, index) => {
      const rowArr: BoardWeekRowType = new Array(columns.length).fill('phantom')

      const nodeData = useSelector((state: AppState) =>
        selectNodeById(state, nodeId)
      )

      const nodeAtIndex = columns.indexOf(nodeData.node.column)
      rowArr[nodeAtIndex] = {
        id: nodeData.node.id,
        title: getNodeTitle(nodeData.node),
        description: nodeData.node.description,
        column: nodeData.node.column
      }

      return rowArr
    })

    return { id: weekId, rows }
  })

  return weeksData
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
