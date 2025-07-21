import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { produce } from 'immer'
import {
  Fragment,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as StyledWeek from './styles'
import * as Styled from '../../styles'
import {
  DraggableType,
  DroppableType,
  isGridCell,
  isGridRow,
  isGridWeek,
  isSidebarPart
} from '../../types'
import {
  BoardWeekRowType,
  CellReorderCallbackFn,
  RowReorderCallbackFn,
  WeekInsertCallbackFn,
  WeekReorderCallbackFn
} from '../../types'
import WeekCell from '../WeekCell'
import { WeekCellNodeType } from '../WeekCell/types'

type WeekPropsType = {
  index: number
  weekId: number
  condensed: boolean
  weekRows: BoardWeekRowType[]
  parentId: number
  columnIds: number[]
  columnColors: string[]
  onNodeReorder: CellReorderCallbackFn
  onRowReorder: RowReorderCallbackFn
  onWeekReorder: WeekReorderCallbackFn
  onWeekInsert: WeekInsertCallbackFn
}

type WeekStateType = {
  expanded: boolean
  closestEdge: Edge | null
  draggedOver: boolean
}

const Week = (props: WeekPropsType) => {
  const [state, setState] = useState<WeekStateType>({
    expanded: true,
    closestEdge: null,
    draggedOver: false
  })
  const sidebarData = useSelector((state: AppState) => state.sidebar.edit)
  const weekWrapperRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const workflow = useSelector((state: AppState) => state.workflow)
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, props.weekId)
  )
  const manager = useRef(new BetterSelectionManager(dispatch))

  const resetState = useCallback(() => {
    setState(
      produce((draft) => {
        draft.draggedOver = false
        draft.closestEdge = null
      })
    )
  }, [])

  useEffect(() => {
    const outerEl = weekWrapperRef.current
    const el = dragHandleRef.current
    return combine(
      draggable({
        element: el,
        getInitialData: () => ({
          index: props.index,
          type: DraggableType.WEEK
        })
      }),
      dropTargetForElements({
        element: outerEl,
        getData: ({ element, input }) => {
          const data = {
            index: props.index,
            type: DraggableType.WEEK
          }
          return attachClosestEdge(data, {
            element,
            input,
            allowedEdges: ['top', 'bottom']
          })
        },
        canDrop({ source }) {
          return isGridWeek(source.data) || isSidebarPart(source.data)
        },
        onDragLeave() {
          resetState()
        },
        onDrag({ source, self }) {
          const dragging = source.data
          if (!isGridWeek(dragging) && !isSidebarPart(dragging)) {
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
        onDrop({ source, self }) {
          const from = source.data
          const to = self.data

          if (!isGridWeek(to)) {
            return
          }

          const closestEdge = extractClosestEdge(to)

          if (isGridWeek(from)) {
            let moveToIndex = to.index
            if (from.index < to.index && closestEdge === 'top') {
              moveToIndex -= 1
            }
            if (from.index > to.index && closestEdge === 'bottom') {
              moveToIndex += 1
            }
            if (from.index !== moveToIndex) {
              props.onWeekReorder(from.index, moveToIndex)
            }
          } else if (isSidebarPart(from)) {
            const insertIndex =
              closestEdge === 'bottom' ? to.index + 1 : to.index
            props.onWeekInsert(insertIndex)
          } else {
            return
          }

          resetState()
        }
      })
    )
  }, [resetState, props])

  const onWeekWrapperClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      manager.current.updateSidebar(
        props.weekId,
        CfObjectType.WEEK,
        props.parentId
      )
    },
    [props.parentId, props.weekId]
  )

  const onNodeClick = useCallback(
    (e: MouseEvent<HTMLDivElement>, nodeId: number) => {
      e.stopPropagation()
      manager.current.updateSidebar(nodeId, CfObjectType.NODE, props.parentId)
    },
    [props.parentId]
  )

  const onCollapseIconClick = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setState(
      produce((draft) => {
        draft.expanded = !draft.expanded
      })
    )
  }, [])

  const weekGrid = props.weekRows.map((row, rowIndex) => (
    <WeekRow
      key={`week_${props.weekId}_${rowIndex}`}
      row={row}
      rowIndex={rowIndex}
      rowCount={props.weekRows.length}
      weekId={props.weekId}
      parentId={props.parentId}
      columnColors={props.columnColors}
      onNodeReorder={props.onNodeReorder}
      onRowReorder={props.onRowReorder}
      onNodeClick={onNodeClick}
    />
  ))

  const defaultText = !workflow.isStrategy
    ? `${weekData.week.weekTypeDisplay} ${weekData.week.order + 1}`
    : undefined

  const selected =
    sidebarData.objectType === CfObjectType.WEEK &&
    sidebarData.id === props.weekId

  return (
    <StyledWeek.WeekWrapper
      onClick={onWeekWrapperClick}
      ref={weekWrapperRef}
      selected={selected}
    >
      <Styled.WeekRowIndicator edge={state.closestEdge} />
      <StyledWeek.WeekHeader
        ref={dragHandleRef}
        expanded={state.expanded && !props.condensed}
      >
        <StyledWeek.WeekTitle variant="subtitle2">
          <TitleText text={weekData.week.title} defaultText={defaultText} />
        </StyledWeek.WeekTitle>

        {!props.condensed && (
          <IconButton onClick={onCollapseIconClick}>
            <KeyboardArrowDown />
          </IconButton>
        )}
      </StyledWeek.WeekHeader>

      {state.expanded && !props.condensed && weekGrid}
    </StyledWeek.WeekWrapper>
  )
}

type WeekRowPropsType = {
  row: BoardWeekRowType
  parentId: number
  weekId: number
  rowIndex: number
  rowCount: number
  columnColors: WeekPropsType['columnColors']
  onRowReorder: WeekPropsType['onRowReorder']
  onNodeReorder: WeekPropsType['onNodeReorder']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeId: number) => void
}

type WeekRowStateType = {
  edge: Edge | null
  draggedOver: boolean
}

const WeekRow = ({
  row,
  weekId,
  rowIndex,
  rowCount,
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

  const resetState = useCallback(() => {
    setState(
      produce((draft) => {
        draft.edge = null
        draft.draggedOver = false
      })
    )
  }, [])

  useEffect(() => {
    const el = ref.current

    dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        // attach custom data for easier identifying on drop
        const data = {
          coords: {
            week: weekId,
            y: rowIndex
          },
          type: DroppableType.ROW
        }
        return attachClosestEdge(data, {
          input,
          element,
          allowedEdges: ['top', 'bottom']
        })
      },
      onDrag: ({ self, source }) => {
        const edge: Edge = extractClosestEdge(self.data)
        const fromData = source.data
        const toData = self.data

        if (!isGridCell(fromData) || !isGridRow(toData)) {
          return
        }

        if (fromData.coords.week === toData.coords.week) {
          // hide the top indicator for the top-most row
          if (fromData.coords.y === 0 && edge === 'top') {
            return
          }

          // and the bottom indicator when dragging the bottom-most row
          if (
            fromData.coords.y === toData.coords.y &&
            toData.coords.y === rowCount - 1 &&
            edge === 'bottom'
          ) {
            return
          }
        }

        setState(
          produce((draft) => {
            if (draft.edge !== edge) {
              draft.edge = edge
            }
            draft.draggedOver = true
          })
        )
      },
      onDrop: ({ self, source }) => {
        const edge: Edge = extractClosestEdge(self.data)
        const fromData = source.data
        const toData = self.data

        if (!isGridCell(fromData) || !isGridRow(toData)) {
          return
        }

        const from = {
          week: fromData.coords.week,
          y: fromData.coords.y
        }

        const to = {
          week: toData.coords.week,
          y: toData.coords.y
        }

        if (from.week === to.week) {
          // early exit if nothing changed
          if (from.y === to.y) {
            resetState()
            return
          }

          // if we've triggered the 'top' side of the row, we still want
          // to nest the dragged item between it and the previous row
          if (edge === 'top') {
            if (from.y < to.y) {
              to.y = Math.max(0, to.y - 1)
            }
          }

          // same as above, but for the bottom edge
          if (edge === 'bottom') {
            if (from.y > to.y) {
              to.y = Math.min(rowCount, to.y + 1)
            }
          }
        } else {
          // if we've triggered the 'top' side of the row, we still want
          // to nest the dragged item between it and the previous row
          if (edge === 'top') {
            to.y = Math.max(0, to.y - 1)
          }

          // same as above, but for the bottom edge
          if (edge === 'bottom') {
            to.y = Math.min(rowCount, to.y + 1)
          }
        }

        onRowReorder(from, to)
        resetState()
      },
      onDragLeave: resetState
    })
  }, [weekId, rowIndex, rowCount, onRowReorder, resetState])

  // show a 'drag things into this container' message if nothing is being dragged
  // and all the nodes for this row are phantom nodes
  if (
    rowCount === 1 &&
    row.every((node) => node === WeekCellNodeType.PHANTOM) &&
    !state.draggedOver
  ) {
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
  if (
    rowCount !== 1 &&
    row.every((node) => node === WeekCellNodeType.PHANTOM)
  ) {
    return (
      <Styled.CellRow ref={ref} style={{ display: 'none' }}>
        <Styled.CellRowIndicator edge={state.edge} />
      </Styled.CellRow>
    )
  }

  return (
    <Styled.CellRow ref={ref}>
      <Styled.CellRowIndicator edge={state.edge} />
      {row.map((node, nodeIndex) => (
        <Fragment key={`${weekId}_${rowIndex}_${nodeIndex}`}>
          {node === WeekCellNodeType.PHANTOM ? (
            <WeekCell
              type={WeekCellNodeType.PHANTOM}
              coords={{
                week: weekId,
                x: nodeIndex,
                y: rowIndex
              }}
              borderColor={columnColors[nodeIndex]}
              onReorder={onNodeReorder}
            />
          ) : (
            <WeekCell
              id={node.id}
              type={WeekCellNodeType.NODE}
              coords={{
                week: weekId,
                x: nodeIndex,
                y: rowIndex
              }}
              borderColor={columnColors[nodeIndex]}
              title={node.title}
              description={node.description}
              hasAutoLink={node.hasAutoLink}
              outgoingLinks={node.outgoingLinks}
              contextType={node.contextType}
              taskType={node.taskType}
              time={node.time}
              onClick={(e) => onNodeClick(e, node.id)}
            />
          )}
        </Fragment>
      ))}
    </Styled.CellRow>
  )
}

export default Week
