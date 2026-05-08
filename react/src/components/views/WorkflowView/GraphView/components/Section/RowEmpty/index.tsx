import { WorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import { memo, useRef } from 'react'
import { useSelector } from 'react-redux'

import type { SectionPropsType } from '../'
import * as StyledWorkflow from '../../../styles'
import SectionCell from '../Cell'
import { SectionCellType } from '../Cell/types'
import * as Styled from '../styles'

type PropsType = {
  sectionuuid: string
  columnIds: WorkflowBoard['columns']['ids']
  columnColors: WorkflowBoard['columns']['colors']
  onNodeDrop: SectionPropsType['onNodeDrop']
}

const EmptySectionRow = ({
  sectionId,
  columnIds,
  columnColors,
  onNodeDrop
}: PropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useSelector((state: RootState) => state.svglink.allowDnd)

  return (
    <StyledWorkflow.CellRow ref={ref} sx={{ minHeight: 120 }}>
      {columnIds.map((columnId, index) => (
        <SectionCell
          key={`${sectionId}_${columnId}`}
          type={SectionCellType.PHANTOM}
          coordsSection={sectionId}
          coordsX={index}
          coordsY={0}
          columnId={columnId}
          borderColor={columnColors[columnId]}
          onReorder={onNodeDrop}
        />
      ))}
      <Styled.EmptyText sx={{ opacity: dragging ? 0 : 1 }}>
        {_t('Drag nodes from the sidebar or other sections to add them here.')}
      </Styled.EmptyText>
    </StyledWorkflow.CellRow>
  )
}

export default memo(EmptySectionRow)
