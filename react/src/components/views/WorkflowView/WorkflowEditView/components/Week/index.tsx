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
import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { RootState } from '@cfRedux/store'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { produce } from 'immer'
import {
  MouseEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import WeekRow from './Row'
import * as StyledWeek from './styles'
import * as Styled from '../../styles'
import { DraggableType, isGridWeek, isSidebarPart } from '../../types'
import {
  CellReorderCallbackFn,
  RowReorderCallbackFn,
  WeekInsertCallbackFn,
  WeekReorderCallbackFn
} from '../../types'

export type WeekPropsType = {
  index: number
  weekId: number
  condensed: boolean
  parentId: number
  columnIds: number[]
  columnColors: Record<number, string>
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
  const dispatch = useDispatch()
  const [state, setState] = useState<WeekStateType>({
    expanded: true,
    closestEdge: null,
    draggedOver: false
  })
  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.WEEK &&
      state.sidebar.edit.id === props.weekId
  )
  const weekWrapperRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  const week = useSelector((state: RootState) =>
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

  const weekGrid = week.nodes.map((nodeId, rowIndex) => (
    <WeekRow
      key={`week_${props.weekId}_${rowIndex}`}
      nodeId={nodeId}
      rowIndex={rowIndex}
      totalRows={week.nodes.length}
      weekId={props.weekId}
      parentId={props.parentId}
      columnIds={props.columnIds}
      columnColors={props.columnColors}
      onNodeReorder={props.onNodeReorder}
      onRowReorder={props.onRowReorder}
      onNodeClick={onNodeClick}
    />
  ))

  const defaultText = !workflow.isStrategy
    ? `${week.weekTypeDisplay} ${week.order + 1}`
    : undefined

  return (
    <StyledWeek.WeekWrapper
      ref={weekWrapperRef}
      selected={selected}
      data-week-id={props.weekId}
    >
      <Styled.WeekRowIndicator edge={state.closestEdge} />
      <StyledWeek.WeekHeader
        ref={dragHandleRef}
        expanded={state.expanded && !props.condensed}
        onClick={onWeekWrapperClick}
      >
        <StyledWeek.WeekTitle variant="subtitle2">
          <TitleText text={week.title} defaultText={defaultText} />
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

export default memo(Week)
