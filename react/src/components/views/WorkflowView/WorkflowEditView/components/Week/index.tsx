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
import useHover from '@cf/hooks/useHover'
import { WorkflowBoard } from '@cf/redux/selectors/workflow.selector'
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
  MutableRefObject,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useResizeObserver } from 'usehooks-ts'

import HoverMenu from './HoverMenu'
import WeekRow from './Row'
import * as StyledWeek from './styles'
import * as Styled from '../../styles'
import { DraggableType, isGridWeek, isSidebarPart } from '../../types'
import {
  CellReorderCallbackFn,
  WeekInsertCallbackFn,
  WeekReorderCallbackFn
} from '../../types'

export type WeekPropsType = {
  index: number
  weekId: number
  weekRows: WorkflowBoard['weeks'][0]['rows']
  redrawer: number
  condensed: boolean
  boardId: WorkflowBoard['id']
  columnIds: WorkflowBoard['columns']['ids']
  columnColors: WorkflowBoard['columns']['colors']
  onWeekCollapse: (weekId: number) => void
  onNodeReorder: CellReorderCallbackFn
  onWeekReorder: WeekReorderCallbackFn
  onWeekInsert: WeekInsertCallbackFn
}

type WeekStateType = {
  closestEdge: Edge | null
  dragging: boolean
  draggedOver: boolean
}

const Week = (props: WeekPropsType) => {
  const dispatch = useDispatch()
  const [state, setState] = useState<WeekStateType>({
    closestEdge: null,
    draggedOver: false,
    dragging: false
  })
  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.WEEK &&
      state.sidebar.edit.id === props.weekId
  )
  const weekWrapperRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const isStrategy = useSelector(
    (state: RootState) => state.workspace.workflow.isStrategy
  )
  const week = useSelector((state: RootState) =>
    selectWeekById(state, props.weekId)
  )
  const manager = useRef(new BetterSelectionManager(dispatch))

  const [_, isHovered] = useHover(dragHandleRef)

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
        onDragStart() {
          setState(
            produce((draft) => {
              draft.dragging = true
            })
          )
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

          setState(
            produce((draft) => {
              draft.dragging = false
            })
          )
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
        props.boardId
      )
    },
    [props.boardId, props.weekId]
  )

  const onNodeClick = useCallback(
    (e: MouseEvent<HTMLDivElement>, nodeId: number) => {
      e.stopPropagation()
      manager.current.updateSidebar(nodeId, CfObjectType.NODE, props.boardId)
    },
    [props.boardId]
  )

  const onCollapseIconClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      props.onWeekCollapse(props.weekId)
    },
    [props]
  )

  const weekGrid = props.weekRows.map((nodes, rowIndex) => (
    <WeekRow
      key={`week_${props.weekId}_${rowIndex}`}
      nodes={nodes}
      rowIndex={rowIndex}
      totalRows={props.weekRows.length}
      weekId={props.weekId}
      parentId={props.boardId}
      columnIds={props.columnIds}
      columnColors={props.columnColors}
      onNodeReorder={props.onNodeReorder}
      onNodeClick={onNodeClick}
    />
  ))

  const defaultText = !isStrategy
    ? `${week.weekTypeDisplay} ${week.order + 1}`
    : undefined

  return (
    <>
      <StyledWeek.WeekWrapper
        ref={weekWrapperRef}
        selected={selected}
        hovering={isHovered}
        data-week-id={props.weekId}
      >
        <Styled.WeekRowIndicator edge={state.closestEdge} />
        <StyledWeek.WeekHeader
          ref={dragHandleRef}
          dragging={state.dragging}
          expanded={!props.condensed}
          onClick={onWeekWrapperClick}
        >
          <StyledWeek.WeekTitle variant="subtitle2">
            <StyledWeek.WeekNumber>{props.index + 1}</StyledWeek.WeekNumber>
            <TitleText text={week.title} defaultText={defaultText} />
          </StyledWeek.WeekTitle>

          <IconButton onClick={onCollapseIconClick} className="arrow-icon">
            <KeyboardArrowDown />
          </IconButton>

          <HoverMenu
            workflowId={props.boardId}
            weekId={props.weekId}
            show={isHovered}
          />
        </StyledWeek.WeekHeader>

        {!props.condensed && weekGrid}
      </StyledWeek.WeekWrapper>
      <Background weekRef={weekWrapperRef} redrawer={props.redrawer} />
    </>
  )
}

// fake week wrapper background element that syncs with the week's BCR
const Background = ({
  redrawer,
  weekRef
}: {
  redrawer: number
  weekRef: MutableRefObject<HTMLDivElement>
}) => {
  const [state, setState] = useState({ top: 0 })

  const { height = 0 } = useResizeObserver({
    ref: weekRef,
    box: 'border-box'
  })

  useLayoutEffect(() => {
    const week = weekRef.current
    const weekTop = week?.getBoundingClientRect().top ?? 0
    const wrapTop = week?.parentElement.getBoundingClientRect().top ?? 0

    if (!week) {
      return
    }

    setState(
      produce((draft) => {
        draft.top = weekTop - wrapTop
      })
    )
  }, [redrawer, height, weekRef])

  if (height === 0) {
    return null
  }

  return (
    <StyledWeek.WeekBackground
      style={{
        top: `${state.top}px`,
        height: `${height}px`
      }}
    />
  )
}

export default memo(Week)
