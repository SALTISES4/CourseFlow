import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { selectWorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { nodeChangedColumn } from '@cf/redux/slices/node.slice'
import { weekMoveNodes } from '@cf/redux/slices/week.slice'
import {
  workflowReorderColumns,
  workflowReorderWeeks
} from '@cf/redux/slices/workflow.slice'
import { _t } from '@cf/utility/Utility.class'
import DeleteSectionDialog from '@cfComponents/dialog/Workflow/DeleteSection'
import { RootState } from '@cfRedux/store'
import { produce } from 'immer'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ColumnsHeader from './components/ColumnsHeader'
import LineSVG from './components/LineSVG'
import Week from './components/Week'
import { WeeksWrapper, WorkflowEditViewWrap } from './styles'
import {
  CellReorderCallbackFn,
  ColumnReorderCallbackFn,
  RowReorderCallbackFn,
  isGridWeek,
  isSidebarPart
} from './types'

type StateType = {
  condensed: number[] | 'all'
  redrawLines: boolean
}

const WorkflowEditView = () => {
  const dispatch = useDispatch()
  const workflowBoard = useSelector(selectWorkflowBoard)
  const weeksWrapperRef = useRef<HTMLDivElement>(null)

  const [state, setState] = useState<StateType>({
    condensed: [],
    redrawLines: false // just to trigger LineSVG to redraw on layout change
  })

  useEffect(() => {
    const el = weeksWrapperRef.current
    return combine(
      // because the user can technically drag elements outside the drop container
      // we use a global monitor to reset the weeks/parts into non-condensed state
      // when a drop (or error, or drop cancel) happens
      monitorForElements({
        onDrop({ source }) {
          if (!isGridWeek(source.data) && !isSidebarPart(source.data)) {
            return
          }
          setState(
            produce((draft) => {
              draft.condensed = []
            })
          )
        }
      }),
      dropTargetForElements({
        element: el,
        canDrop({ source }) {
          return isGridWeek(source.data) || isSidebarPart(source.data)
        },
        onDragStart({ source }) {
          if (!isGridWeek(source.data) && !isSidebarPart(source.data)) {
            return
          }
          setState(
            produce((draft) => {
              draft.condensed = 'all'
            })
          )
        }
      })
    )
  }, [])

  const triggerLineRerender = useCallback(() => {
    setTimeout(() => {
      setState(
        produce((draft) => {
          draft.redrawLines = !draft.redrawLines
        })
      )
    }, 0) // schedule for next frame
  }, [])

  // just do the initial line rerender once DOM is ready
  useLayoutEffect(() => triggerLineRerender(), [triggerLineRerender])

  const onColumnReorder: ColumnReorderCallbackFn = useCallback(
    (oldIndex: number, newIndex: number) => {
      dispatch(
        workflowReorderColumns({ moveIndex: oldIndex, toIndex: newIndex })
      )
      triggerLineRerender()
    },
    [dispatch, triggerLineRerender]
  )

  const onWeekCollapse = useCallback((weekId: number) => {
    setState(
      produce((draft) => {
        if (Array.isArray(draft.condensed)) {
          const index = draft.condensed.indexOf(weekId)
          if (index !== -1) {
            draft.condensed.splice(index, 1)
          } else {
            draft.condensed.push(weekId)
          }
        }
      })
    )
  }, [])

  const onWeekInsert = useCallback((insertIndex: number) => {
    console.log('+++ WEEK INSERT', { insertIndex })
    // TODO: figure out how sidebar parts/strategies work
    // dispatch workflow week insert
    // state.weeks.splice(insertIndex, 0, dataForTheInsertedWeek)
  }, [])

  const onWeekReorder = useCallback(
    (from: number, to: number) => {
      dispatch(workflowReorderWeeks({ fromIndex: from, toIndex: to }))
      triggerLineRerender()
    },
    [dispatch, triggerLineRerender]
  )

  const onRowDragEnd: RowReorderCallbackFn = useCallback(
    (from, to) => {
      dispatch(
        weekMoveNodes({
          from: { weekId: from.week, index: from.y },
          to: { weekId: to.week, index: to.y }
        })
      )
      triggerLineRerender()
    },
    [dispatch, triggerLineRerender]
  )

  const onNodeDragEnd: CellReorderCallbackFn = useCallback(
    (id, week, columnId) => {
      dispatch(nodeChangedColumn({ id, data: { column: columnId } }))
      triggerLineRerender()
    },
    [dispatch, triggerLineRerender]
  )

  return (
    <WorkflowEditViewWrap dragging={workflowBoard.dragging}>
      <ColumnsHeader board={workflowBoard} onReorder={onColumnReorder} />
      <WeeksWrapper data-test-id="weeks-block" ref={weeksWrapperRef}>
        {workflowBoard.weeks.map((week, index) => (
          <Week
            key={`week_${week.id}`}
            index={index}
            week={week}
            board={workflowBoard}
            condensed={
              state.condensed === 'all' || state.condensed.includes(week.id)
            }
            onWeekCollapse={onWeekCollapse}
            onWeekInsert={onWeekInsert}
            onWeekReorder={onWeekReorder}
            onRowReorder={onRowDragEnd}
            onNodeReorder={onNodeDragEnd}
            redrawer={state.condensed.length}
          />
        ))}
        <LineSVG
          rerender={state.redrawLines}
          condensed={state.condensed.length}
        />
      </WeeksWrapper>

      {/* dialogs */}
      <DeleteSectionDialog />
    </WorkflowEditViewWrap>
  )
}

export default memo(WorkflowEditView)
