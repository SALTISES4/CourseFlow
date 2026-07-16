import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { RootState } from '@cf/redux/store'
import { defaultColumnSettings } from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import { SectionRowPropsType } from '@cfViews/WorkflowView/GraphView/components/Section/Row/type'
import { alpha } from '@mui/material'
import { ReactNode, memo, useRef } from 'react'
import { useSelector } from 'react-redux'

import useRowDnd from './useRowDnd'
import * as StyledWorkflow from '../../../styles'
import SectionCell from '../Cell'
import DropIndicator from '../Cell/DropIndicator'
import { SectionCellType } from '../Cell/types'
import * as StyledSection from '../styles'

const SectionRow = (props: SectionRowPropsType) => {
  const rowRef = useRef<HTMLDivElement>(null)
  const canAddNodes = useResourcePermission(WorkflowPermission.NODE_MANAGEMENT)
  const dnd = useRowDnd({ ...props, rowRef, enabled: canAddNodes })
  const {
    sectionId,
    rowIndex,
    columnIds,
    columnColors,
    onNodeDrop,
    graphUuid
  } = props

  const draggingCustomNode = dnd.dragId === '-1'

  if (rowIndex === 'empty') {
    return (
      <StyledWorkflow.CellRow
        ref={rowRef}
        style={{
          minHeight: 120,
          backgroundColor:
            draggingCustomNode &&
            alpha(defaultColumnSettings['new-column'].colour, 0.2)
        }}
      >
        <SectionRowEmpty>
          {columnIds.map((columnId, index) => (
            <SectionCell
              key={`${sectionId}_${columnId}`}
              type={SectionCellType.PHANTOM}
              coordsSection={sectionId}
              coordsX={index}
              coordsY={0}
              columnId={columnId}
              highlight={dnd.dragId === columnId ? 'cell' : null}
              borderColor={columnColors[columnId]}
              onReorder={onNodeDrop}
              emptyRow
            />
          ))}
        </SectionRowEmpty>
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
          <SectionCell
            key={`${sectionId}_${rowIndex}_${columnId}`}
            type={SectionCellType.NODE}
            coordsSection={sectionId}
            coordsX={index}
            coordsY={rowIndex}
            nodeId={nodeId}
            graphUuid={graphUuid}
            columnId={columnId}
            borderColor={columnColors[columnId]}
            highlight={dnd.dragId === columnId ? dnd.closestEdge : null}
            onReorder={onNodeDrop}
            onClick={onNodeClick}
          />
        ) : (
          <SectionCell
            key={`${sectionId}_${rowIndex}_${columnId}`}
            type={SectionCellType.PHANTOM}
            coordsSection={sectionId}
            coordsX={index}
            coordsY={rowIndex}
            columnId={columnId}
            highlight={dnd.dragId === columnId ? 'cell' : null}
            borderColor={columnColors[columnId]}
            onReorder={onNodeDrop}
          />
        )
      })}
      {dnd.highlightEdge && (
        <DropIndicator edge={dnd.highlightEdge} offset={-3} />
      )}
    </StyledWorkflow.CellRow>
  )
}

const SectionRowEmpty = ({ children }: { children: ReactNode }) => {
  const dragging = useSelector((state: RootState) => state.svglink.allowDnd)

  return (
    <>
      {children}
      <StyledSection.EmptyText sx={{ opacity: dragging ? 0 : 1 }}>
        {_t('Drag nodes from the sidebar or other sections to add them here.')}
      </StyledSection.EmptyText>
    </>
  )
}

export default memo(SectionRow)
