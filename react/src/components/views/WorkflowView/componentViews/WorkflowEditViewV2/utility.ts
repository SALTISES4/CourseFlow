import { selectNodeById } from '@cf/redux/selectors/node.selector'
import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { AppState, TWorkflow } from '@cf/redux/types/type'
import { useSelector } from 'react-redux'

import { getNodeTitle } from './components/Node/utility'

export type BoardNodeType =
  | 'phantom'
  | {
      id: number
      title: string
      description: string
      column: number
    }

export type BoardWeekRowType = BoardNodeType[]

type WeekId = number

export type BoardWeekType = {
  id: WeekId
  rows: BoardWeekRowType[]
}

export type BoardType = BoardWeekType[]

export function getWorkflowBoardData(workflow: TWorkflow): BoardType {
  const { weeks, columns } = workflow

  const weeksData = weeks.map((weekId) => {
    const weekData = useSelector((appState: AppState) =>
      selectWeekById(appState, weekId)
    )

    const weekNodes = weekData.week.nodes
    // Create phantom nodes if initially empty
    if (!weekNodes.length) {
      const row: BoardNodeType[] = new Array(columns.length).fill('phantom')
      return { id: weekId, rows: [row] }
    }

    // else, every node is on its own row and associated to a single column ID
    const rows = weekNodes.map((nodeId, index) => {
      const rowArr: BoardNodeType[] = new Array(columns.length).fill('phantom')

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

// droppableId={`week_${props.weekId}_${rowIndex}`}
export function parseWeekDroppableId(id: string) {
  const split = id.split('_')
  return {
    weekId: parseInt(split[1], 10),
    rowId: parseInt(split[2], 10)
  }
}
