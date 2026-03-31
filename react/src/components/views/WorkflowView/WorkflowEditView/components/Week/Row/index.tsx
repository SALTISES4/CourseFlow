import { WorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { RootState } from '@cf/redux/store'
import { defaultColumnSettings } from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import * as StyledWorkflow from '@cfViews/WorkflowView/WorkflowEditView/styles'
import { alpha } from '@mui/material'
import { MouseEvent, ReactNode, memo, useRef } from 'react'
import { useSelector } from 'react-redux'

import useRowDnd from './useRowDnd'
import type { WeekPropsType } from '../'
import WeekCell from '../Cell'
import DropIndicator from '../Cell/DropIndicator'
import { WeekCellType } from '../Cell/types'
import * as StyledWeek from '../styles'

interface NonEmptyRowType {
  nodes: WorkflowBoard['weeks'][0]['rows'][0]
  parentid: string
  weekid: string
  rowIndex: number
  columnIds: WorkflowBoard['columns']['ids']
  columnColors: WorkflowBoard['columns']['colors']
  onNodeDrop: WeekPropsType['onNodeDrop']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeid: string) => void
}

interface EmptyRowType
  extends Pick<
    NonEmptyRowType,
    'weekId' | 'columnIds' | 'columnColors' | 'onNodeDrop'
  > {
  rowIndex: 'empty'
}

export type WeekRowPropsType = EmptyRowType | NonEmptyRowType

const WeekRow = (props: WeekRowPropsType) => {
  const rowRef = useRef<HTMLDivElement>(null)
  const dnd = useRowDnd({ ...props, rowRef })
  const { weekId, rowIndex, columnIds, columnColors, onNodeDrop } = props

  if (rowIndex === 'empty') {
    return (
      <StyledWorkflow.CellRow
        ref={rowRef}
        style={{
          minHeight: 120,
          backgroundColor:
            dnd.dragId === -1 &&
            alpha(defaultColumnSettings['new-column'].colour, 0.2)
        }}
      >
        <WeekRowEmpty>
          {columnIds.map((columnId, index) => (
            <WeekCell
              key={`${weekId}_${columnId}`}
              type={WeekCellType.PHANTOM}
              coordsWeek={weekId}
              coordsX={index}
              coordsY={0}
              columnId={columnId}
              highlight={dnd.dragId === columnId}
              borderColor={columnColors[columnId]}
              onReorder={onNodeDrop}
              emptyRow
            />
          ))}
        </WeekRowEmpty>
      </StyledWorkflow.CellRow>
    )
  }

  const { nodes, onNodeClick } = props

  return (
    <StyledWorkflow.CellRow
      ref={rowRef}
      style={{
        backgroundColor:
          dnd.highlightRow &&
          alpha(defaultColumnSettings['new-column'].colour, 0.2)
      }}
    >
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
            onReorder={onNodeDrop}
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
            onReorder={onNodeDrop}
          />
        )
      })}
      {dnd.closestEdge && <DropIndicator edge={dnd.closestEdge} offset={-3} />}
    </StyledWorkflow.CellRow>
  )
}

const WeekRowEmpty = ({ children }: { children: ReactNode }) => {
  const dragging = useSelector((state: RootState) => state.svglink.allowDnd)

  return (
    <>
      {children}
      <StyledWeek.EmptyText sx={{ opacity: dragging ? 0 : 1 }}>
        {_t('Drag nodes from the sidebar or other sections to add them here.')}
      </StyledWeek.EmptyText>
    </>
  )
}

export default memo(WeekRow)
