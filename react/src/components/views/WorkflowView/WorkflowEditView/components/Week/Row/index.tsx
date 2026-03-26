import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { getNextLargestNumber } from '@cf/redux/selectors/helpers'
import { WorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { columnInsertBelow } from '@cf/redux/slices/column.slice'
import { nodeWorkflowInsert } from '@cf/redux/slices/node.slice'
import store from '@cf/redux/store'
import { RootState } from '@cf/redux/store'
import { defaultColumnSettings } from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import * as StyledWorkflow from '@cfViews/WorkflowView/WorkflowEditView/styles'
import {
  isSidebarCustomNode,
  isSidebarNode
} from '@cfViews/WorkflowView/WorkflowEditView/types'
import { alpha } from '@mui/material'
import { produce } from 'immer'
import { MouseEvent, ReactNode, memo, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { WeekPropsType } from '../'
import WeekCell from '../Cell'
import DropIndicator from '../Cell/DropIndicator'
import { WeekCellType } from '../Cell/types'
import * as StyledWeek from '../styles'

interface NonEmptyRowType {
  nodes: WorkflowBoard['weeks'][0]['rows'][0]
  parentId: number
  weekId: number
  rowIndex: number
  columnIds: WorkflowBoard['columns']['ids']
  columnColors: WorkflowBoard['columns']['colors']
  onNodeDrop: WeekPropsType['onNodeDrop']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeId: number) => void
}

interface EmptyRowType
  extends Pick<
    NonEmptyRowType,
    'weekId' | 'columnIds' | 'columnColors' | 'onNodeDrop'
  > {
  rowIndex: 'empty'
}

type WeekRowPropsType = EmptyRowType | NonEmptyRowType

type StateType = {
  highlightRow: boolean
  dragId: number | null
  closestEdge: Edge | null
}

const WeekRow = (props: WeekRowPropsType) => {
  const dispatch = useDispatch()
  const rowRef = useRef<HTMLDivElement>(null)
  const wsColIds = useSelector((state: RootState) => state.workspace.column.ids)
  const [state, setState] = useState<StateType>({
    highlightRow: false,
    dragId: null,
    closestEdge: null
  })

  const { weekId, rowIndex, columnIds, columnColors, onNodeDrop } = props

  useEffect(() => {
    return dropTargetForElements({
      element: rowRef.current,
      getData: ({ element, input }) => {
        return attachClosestEdge(
          { row: rowIndex },
          {
            element,
            input,
            allowedEdges: ['top', 'bottom']
          }
        )
      },
      canDrop: ({ source }) => isSidebarNode(source.data),
      onDragEnter: ({ source }) => {
        const dragging = source.data
        if (!isSidebarNode(dragging)) {
          return
        }
        setState(
          produce((draft) => {
            const columnMode =
              store.getState().workspace.node.insertMode === 'column'
            draft.highlightRow = columnMode && isSidebarCustomNode(dragging)
            draft.dragId = dragging.id
          })
        )
      },
      onDragLeave: () => {
        setState({ highlightRow: false, dragId: null, closestEdge: null })
      },
      onDrag: ({ source, self }) => {
        if (!isSidebarNode(source.data) || isSidebarCustomNode(source.data)) {
          return
        }

        const closestEdge = extractClosestEdge(self.data)
        if (!closestEdge) {
          return
        }

        setState(
          produce((draft) => {
            draft.closestEdge = closestEdge
          })
        )
      },
      onDrop: ({ source, self }) => {
        const row = self.data.row as number
        let columnId = source.data.id as number
        let closestEdge = extractClosestEdge(self.data)

        const columnMode =
          store.getState().workspace.node.insertMode === 'column'

        if (isSidebarCustomNode(source.data) && columnMode) {
          columnId = getNextLargestNumber(wsColIds)
          closestEdge = 'top'
          dispatch(columnInsertBelow({ id: null, newId: columnId }))
        }

        dispatch(
          nodeWorkflowInsert({
            newColumn: isSidebarCustomNode(source.data),
            columnId,
            weekId,
            row:
              rowIndex === 'empty' ? 0 : closestEdge === 'top' ? row : row + 1
          })
        )

        setState({ highlightRow: false, dragId: null, closestEdge: null })
      }
    })
  }, [dispatch, wsColIds, weekId, rowIndex])

  if (rowIndex === 'empty') {
    return (
      <StyledWorkflow.CellRow
        ref={rowRef}
        style={{
          minHeight: 120,
          backgroundColor:
            state.dragId === -1 &&
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
              highlight={state.dragId === columnId}
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
          state.highlightRow &&
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
      {state.closestEdge && (
        <DropIndicator edge={state.closestEdge} offset={-3} />
      )}
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
