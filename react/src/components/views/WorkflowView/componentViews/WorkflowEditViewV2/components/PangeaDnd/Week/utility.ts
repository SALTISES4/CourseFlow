import { selectNodeById } from '@cf/redux/selectors/node.selector'
import { AppState, TWeek } from '@cf/redux/types/type'
import { useSelector } from 'react-redux'

export function getWeekNodesData(weekData: TWeek, columnIds: number[]) {
  const nodes = weekData.nodes
  // Create phantom nodes if initially empty
  // TODO: figure out unique IDs for phantom nodes?
  if (!nodes.length) {
    return [new Array(columnIds.length).fill('phantom')]
  }

  // else, every node is on its own row and associated to a single column ID
  const rows = nodes.map((nodeId, index) => {
    const rowArr = new Array(columnIds.length).fill('phantom')

    const nodeData = useSelector((state: AppState) =>
      selectNodeById(state, nodeId)
    )

    const nodeAtIndex = columnIds.indexOf(nodeData.node.column)
    rowArr[nodeAtIndex] = nodeData

    return rowArr
  })

  return rows
}
