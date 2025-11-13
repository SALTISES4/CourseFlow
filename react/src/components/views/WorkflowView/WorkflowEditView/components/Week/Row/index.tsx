import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { WorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { produce } from 'immer'
import {
  MouseEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import type { WeekPropsType } from '../'
import * as Styled from '../../../styles'
import { DroppableType, isGridCell, isGridRow } from '../../../types'
import WeekCell from '../Cell'
import { WeekCellNodeType } from '../Cell/types'

type WeekRowPropsType = {
  nodes: WorkflowBoard['weeks'][0]['rows'][0]
  parentId: number
  weekId: number
  rowIndex: number
  totalRows: number
  columnIds: WorkflowBoard['columns']['ids']
  columnColors: WorkflowBoard['columns']['colors']
  onRowReorder: WeekPropsType['onRowReorder']
  onNodeReorder: WeekPropsType['onNodeReorder']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeId: number) => void
}

type WeekRowStateType = {
  edge: Edge | null
  draggedOver: boolean
}

const WeekRow = ({
  nodes,
  weekId,
  rowIndex,
  totalRows,
  columnIds,
  columnColors,
  onNodeReorder,
  onRowReorder,
  onNodeClick
}: WeekRowPropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<WeekRowStateType>({
    edge: null,
    draggedOver: false
  })

  const rowNodeCount = Object.keys(nodes).length

  // const onNodeClicked = useCallback(
  //   (e: MouseEvent<HTMLDivElement>) => onNodeClick(e, nodeId),
  //   [onNodeClick, nodeId]
  // )

  const onNodeClicked = useCallback((e: MouseEvent<HTMLDivElement>) => {
    console.log('clicked me', e)
  }, [])

  const resetState = useCallback(() => {
    setState(
      produce((draft) => {
        draft.edge = null
        draft.draggedOver = false
      })
    )
  }, [])

  // useEffect(() => {
  //   const el = ref.current

  //   dropTargetForElements({
  //     element: el,
  //     getData: ({ input, element }) => {
  //       // attach custom data for easier identifying on drop
  //       const data = {
  //         coords: {
  //           week: weekId,
  //           y: rowIndex
  //         },
  //         type: DroppableType.ROW
  //       }
  //       return attachClosestEdge(data, {
  //         input,
  //         element,
  //         allowedEdges: ['top', 'bottom']
  //       })
  //     },
  //     onDrag: ({ self, source }) => {
  //       const edge: Edge = extractClosestEdge(self.data)
  //       const fromData = source.data
  //       const toData = self.data

  //       if (!isGridCell(fromData) || !isGridRow(toData)) {
  //         return
  //       }

  //       if (fromData.coords.week === toData.coords.week) {
  //         // hide the top indicator for the top-most row
  //         if (fromData.coords.y === 0 && edge === 'top') {
  //           return
  //         }

  //         // and the bottom indicator when dragging the bottom-most row
  //         if (
  //           fromData.coords.y === toData.coords.y &&
  //           toData.coords.y === totalRows - 1 &&
  //           edge === 'bottom'
  //         ) {
  //           return
  //         }
  //       }

  //       setState(
  //         produce((draft) => {
  //           if (draft.edge !== edge) {
  //             draft.edge = edge
  //           }
  //           draft.draggedOver = true
  //         })
  //       )
  //     },
  //     onDrop: ({ self, source }) => {
  //       const edge: Edge = extractClosestEdge(self.data)
  //       const fromData = source.data
  //       const toData = self.data

  //       if (!isGridCell(fromData) || !isGridRow(toData)) {
  //         return
  //       }

  //       const from = {
  //         week: fromData.coords.week,
  //         y: fromData.coords.y
  //       }

  //       const to = {
  //         week: toData.coords.week,
  //         y: toData.coords.y
  //       }

  //       if (from.week === to.week) {
  //         // early exit if nothing changed
  //         if (from.y === to.y) {
  //           resetState()
  //           return
  //         }

  //         // if we've triggered the 'top' side of the row, we still want
  //         // to nest the dragged item between it and the previous row
  //         if (edge === 'top') {
  //           if (from.y < to.y) {
  //             to.y = Math.max(0, to.y - 1)
  //           }
  //         }

  //         // same as above, but for the bottom edge
  //         if (edge === 'bottom') {
  //           if (from.y > to.y) {
  //             to.y = Math.min(totalRows, to.y + 1)
  //           }
  //         }
  //       } else {
  //         // if we've triggered the 'top' side of the row, we still want
  //         // to nest the dragged item between it and the previous row
  //         if (edge === 'top') {
  //           to.y = Math.max(0, to.y - 1)
  //         }

  //         // same as above, but for the bottom edge
  //         if (edge === 'bottom') {
  //           to.y = Math.min(totalRows, to.y + 1)
  //         }
  //       }

  //       console.log(`ROW REORDER -`, { fromData, toData })
  //       onRowReorder(from, to)
  //       resetState()
  //     },
  //     onDragLeave: resetState
  //   })
  // }, [weekId, rowIndex, totalRows, onRowReorder, resetState])

  // show a 'drag things into this container' message if nothing is being dragged
  // and all the nodes for this row are phantom nodes
  if (totalRows === 1 && !rowNodeCount && !state.draggedOver) {
    return (
      <Styled.CellRow ref={ref}>
        <span style={{ minHeight: 50 }}>
          Drag nodes from the sidebar or other parts to add them here.
        </span>
      </Styled.CellRow>
    )
  }

  // don't render empty phantom rows unless it's the only empty row in the week/part
  // but still need to supply the ref to make drag listeners happy hence the empty div
  if (totalRows !== 1 && !rowNodeCount) {
    return (
      <Styled.CellRow ref={ref} style={{ display: 'none' }}>
        <Styled.CellRowIndicator edge={state.edge} />
      </Styled.CellRow>
    )
  }

  return (
    <Styled.CellRow ref={ref}>
      <Styled.CellRowIndicator edge={state.edge} />
      {columnIds.map((columnId, index) => {
        const nodeId = nodes[index]
        return nodeId ? (
          <WeekCell
            key={`${weekId}_${rowIndex}_${columnId}`}
            type={WeekCellNodeType.NODE}
            coordsWeek={weekId}
            coordsX={index}
            coordsY={rowIndex}
            nodeId={nodeId}
            borderColor={columnColors[columnId]}
            onClick={onNodeClicked}
          />
        ) : (
          <WeekCell
            key={`${weekId}_${rowIndex}_${columnId}`}
            type={WeekCellNodeType.PHANTOM}
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
}

export default memo(WeekRow)
