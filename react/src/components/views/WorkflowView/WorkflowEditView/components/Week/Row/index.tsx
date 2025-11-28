import { WorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { _t } from '@cf/utility/Utility.class'
import { MouseEvent, memo } from 'react'

import type { WeekPropsType } from '../'
import * as Styled from '../../../styles'
import WeekCell from '../Cell'
import { WeekCellType } from '../Cell/types'

type WeekRowPropsType = {
  nodes: WorkflowBoard['weeks'][0]['rows'][0]
  parentId: number
  weekId: number
  rowIndex: number
  columnIds: WorkflowBoard['columns']['ids']
  columnColors: WorkflowBoard['columns']['colors']
  onNodeReorder: WeekPropsType['onNodeReorder']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeId: number) => void
}

const WeekRow = ({
  nodes,
  weekId,
  rowIndex,
  columnIds,
  columnColors,
  onNodeReorder,
  onNodeClick
}: WeekRowPropsType) => (
  <Styled.CellRow>
    {columnIds.map((columnId, index) => {
      const nodeId = nodes[index]
      return nodeId ? (
        <WeekCell
          key={`${weekId}_${rowIndex}_${columnId}`}
          type={WeekCellType.NODE}
          coordsWeek={weekId}
          coordsX={index}
          coordsY={rowIndex}
          nodeId={nodeId}
          columnId={columnId}
          borderColor={columnColors[columnId]}
          onReorder={onNodeReorder}
          onClick={onNodeClick}
        />
      ) : (
        <WeekCell
          key={`${weekId}_${rowIndex}_${columnId}`}
          type={WeekCellType.PHANTOM}
          coordsWeek={weekId}
          coordsX={index}
          coordsY={rowIndex}
          columnId={columnId}
          borderColor={columnColors[columnId]}
          onReorder={onNodeReorder}
        />
      )
    })}
  </Styled.CellRow>
)

export default memo(WeekRow)
