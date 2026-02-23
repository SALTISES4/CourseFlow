import { WorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import * as StyledWorkflow from '@cfViews/WorkflowView/WorkflowEditView/styles'
import { memo, useRef } from 'react'
import { useSelector } from 'react-redux'

import type { WeekPropsType } from '../'
import WeekCell from '../Cell'
import { WeekCellType } from '../Cell/types'
import * as Styled from '../styles'

type PropsType = {
  weekId: number
  columnIds: WorkflowBoard['columns']['ids']
  columnColors: WorkflowBoard['columns']['colors']
  onNodeReorder: WeekPropsType['onNodeReorder']
}

const EmptyWeekRow = ({
  weekId,
  columnIds,
  columnColors,
  onNodeReorder
}: PropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useSelector((state: RootState) => state.svglink.allowDnd)

  return (
    <StyledWorkflow.CellRow ref={ref} sx={{ minHeight: 120 }}>
      {columnIds.map((columnId, index) => (
        <WeekCell
          key={`${weekId}_${columnId}`}
          type={WeekCellType.PHANTOM}
          coordsWeek={weekId}
          coordsX={index}
          coordsY={0}
          columnId={columnId}
          borderColor={columnColors[columnId]}
          onReorder={onNodeReorder}
        />
      ))}
      <Styled.EmptyText sx={{ opacity: dragging ? 0 : 1 }}>
        {_t('Drag nodes from the sidebar or other sections to add them here.')}
      </Styled.EmptyText>
    </StyledWorkflow.CellRow>
  )
}

export default memo(EmptyWeekRow)
