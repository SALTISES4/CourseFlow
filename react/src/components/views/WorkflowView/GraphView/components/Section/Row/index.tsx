import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { RootState } from '@cf/redux/store'
import { defaultColumnSettings } from '@cf/utility/constants'
import { SectionRowPropsType } from '@cfViews/WorkflowView/GraphView/components/Section/Row/type'
import { alpha } from '@mui/material'
import { ReactNode, memo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import useRowDnd from './useRowDnd'
import * as StyledWorkflow from '../../../styles'
import SectionCell from '../Cell'
import DropIndicator from '../Cell/DropIndicator'
import InsertMenu from '../Cell/InsertMenu'
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
        data-test-id="workflow-section-row"
        data-row-index={rowIndex}
        style={{
          minHeight: 120,
          backgroundColor: draggingCustomNode
            ? alpha(defaultColumnSettings['new-column'].colour, 0.2)
            : undefined
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
              highlight={dnd.dragId === columnId ? 'cell' : undefined}
              borderColor={columnColors[columnId]}
              onReorder={onNodeDrop}
              emptyRow
            />
          ))}
        </SectionRowEmpty>
        <InsertMenu
          anchorEl={dnd.pendingDrop ? rowRef.current : null}
          onOption={dnd.chooseManualPlacement}
          onClose={dnd.cancelManualPlacement}
        />
      </StyledWorkflow.CellRow>
    )
  }

  const { nodes, onNodeClick } = props

  return (
    <StyledWorkflow.CellRow
      ref={rowRef}
      data-test-id="workflow-section-row"
      data-row-index={rowIndex}
      style={{
        backgroundColor: dnd.highlightRow
          ? alpha(defaultColumnSettings['new-column'].colour, 0.2)
          : undefined
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
            highlight={
              dnd.dragId === columnId
                ? (dnd.closestEdge ?? undefined)
                : undefined
            }
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
            highlight={dnd.dragId === columnId ? 'cell' : undefined}
            borderColor={columnColors[columnId]}
            onReorder={onNodeDrop}
          />
        )
      })}
      {dnd.highlightEdge && (
        <DropIndicator edge={dnd.highlightEdge} offset={-3} />
      )}
      <InsertMenu
        anchorEl={dnd.pendingDrop ? rowRef.current : null}
        onOption={dnd.chooseManualPlacement}
        onClose={dnd.cancelManualPlacement}
      />
    </StyledWorkflow.CellRow>
  )
}

const SectionRowEmpty = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('workflow')
  const dragging = useSelector((state: RootState) => state.svglink.allowDnd)

  return (
    <>
      {children}
      <StyledSection.EmptyText sx={{ opacity: dragging ? 0 : 1 }}>
        {t('graph.emptySection')}
      </StyledSection.EmptyText>
    </>
  )
}

export default memo(SectionRow)
