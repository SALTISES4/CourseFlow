import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box'
import { getNextLargestNumber } from '@cf/redux/selectors/helpers'
import { WorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { columnInsertBelow } from '@cf/redux/slices/column.slice'
import { nodeWorkflowInsert } from '@cf/redux/slices/node.slice'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import { produce } from 'immer'
import { MouseEvent, ReactNode, memo, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { WeekPropsType } from '../'
import * as StyledWorkflow from '../../../styles'
import { isSidebarNode } from '../../../types'
import WeekCell from '../Cell'
import { WeekCellType } from '../Cell/types'
import * as StyledWeek from '../styles'

interface NonEmptyRowType {
  nodes: WorkflowBoard['weeks'][0]['rows'][0]
  parentId: number
  weekId: number
  rowIndex: number
  columnIds: WorkflowBoard['columns']['ids']
  columnColors: WorkflowBoard['columns']['colors']
  onNodeReorder: WeekPropsType['onNodeReorder']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeId: number) => void
}

interface EmptyRowType
  extends Pick<
    NonEmptyRowType,
    'weekId' | 'columnIds' | 'columnColors' | 'onNodeReorder'
  > {
  rowIndex: 'empty'
}

type WeekRowPropsType = EmptyRowType | NonEmptyRowType

type StateType = {
  draggingOver: number | null
  closestEdge: Edge | null
}

const WeekRow = (props: WeekRowPropsType) => {
  const dispatch = useDispatch()
  const rowRef = useRef<HTMLDivElement>(null)
  const wsColIds = useSelector((state: RootState) => state.workspace.column.ids)
  const [state, setState] = useState<StateType>({
    draggingOver: null,
    closestEdge: null
  })

  const { weekId, rowIndex, columnIds, columnColors, onNodeReorder } = props

  useEffect(() => {
    return dropTargetForElements({
      element: rowRef.current,
      getData: ({ element, input }) => {
        return attachClosestEdge(
          { weekId: weekId, row: rowIndex },
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
            draft.draggingOver = dragging.id
          })
        )
      },
      onDragLeave: () => setState({ draggingOver: null, closestEdge: null }),
      onDrag: ({ source, self }) => {
        if (!isSidebarNode(source.data)) {
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
        let columnId = source.data.id as number
        const row = self.data.row as number
        const closestEdge = extractClosestEdge(self.data)

        if (columnId === -1) {
          columnId = getNextLargestNumber(wsColIds)
          dispatch(columnInsertBelow({ id: columnId }))
        }

        dispatch(
          nodeWorkflowInsert({
            columnId,
            weekId: weekId,
            row:
              rowIndex === 'empty' ? 0 : closestEdge === 'top' ? row : row + 1
          })
        )

        setState({ draggingOver: null, closestEdge: null })
      }
    })
  }, [dispatch, wsColIds, weekId, rowIndex])

  if (rowIndex === 'empty') {
    return (
      <StyledWorkflow.CellRow
        ref={rowRef}
        sx={{
          minHeight: 120,
          backgroundColor:
            state.draggingOver === -1 ? 'rgba(4, 186, 116, 0.2)' : 'transparent'
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
              highlight={state.draggingOver === columnId}
              borderColor={columnColors[columnId]}
              onReorder={onNodeReorder}
              empty
            />
          ))}
        </WeekRowEmpty>
      </StyledWorkflow.CellRow>
    )
  }

  const { nodes, onNodeClick } = props

  return (
    <StyledWorkflow.CellRow ref={rowRef}>
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
      {state.closestEdge && (
        <DropIndicator edge={state.closestEdge} type="no-terminal" />
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
