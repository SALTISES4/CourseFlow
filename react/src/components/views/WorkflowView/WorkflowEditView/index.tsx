import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { selectWorkflowBoard } from '@cf/redux/selectors/workflow.selector'
import { nodeWorkflowReorder } from '@cf/redux/slices/node.slice'
import {
  workflowReorderColumns,
  workflowReorderSection
} from '@cf/redux/slices/workflow.slice'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import DeleteNodeCategoryDialog from '@cfComponents/dialog/Workflow/DeleteNodeCategory'
import DeleteSectionDialog from '@cfComponents/dialog/Workflow/DeleteSection'
import { produce } from 'immer'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useResizeObserver } from 'usehooks-ts'

import ColumnsHeader from './components/ColumnsHeader'
import LineSVG from './components/LineSVG'
import Week from './components/Week'
import { WeeksWrapper, WorkflowEditViewWrap } from './styles'
import {
  CellReorderCallbackFn,
  ColumnReorderCallbackFn,
  WeekInsertCallbackFn,
  WeekReorderCallbackFn,
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
  const dragging = useSelector((state: RootState) => state.svglink.allowDnd)
  const weeksWrapperRef = useRef<HTMLDivElement>(null)

  const [state, setState] = useState<StateType>({
    condensed: [],
    redrawLines: false // just to trigger LineSVG to redraw on layout change
  })

  // basically retrigger repaint when any width/height change happens
  // to trigger week backgrounds to correctly recalculate their BCR
  useResizeObserver({
    ref: weeksWrapperRef,
    box: 'border-box'
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

  const onWeekInsert: WeekInsertCallbackFn = useCallback((insertIndex) => {
    console.log('+++ WEEK INSERT', { insertIndex })
    // TODO: figure out how sidebar parts/strategies work
    // dispatch workflow week insert
    // state.weeks.splice(insertIndex, 0, dataForTheInsertedWeek)
  }, [])

  const onWeekReorder: WeekReorderCallbackFn = useCallback(
    (from, to) => {
      dispatch(workflowReorderSection({ fromIndex: from, toIndex: to }))
      triggerLineRerender()
    },
    [dispatch, triggerLineRerender]
  )

  const onNodeDragEnd: CellReorderCallbackFn = useCallback(
    (payload) => {
      dispatch(nodeWorkflowReorder(payload))
      triggerLineRerender()
    },
    [dispatch, triggerLineRerender]
  )

  return (
    <WorkflowEditViewWrap dragging={dragging}>
      <ColumnsHeader board={workflowBoard} onReorder={onColumnReorder} />
      <WeeksWrapper data-test-id="weeks-block" ref={weeksWrapperRef}>
        {workflowBoard.weeks.map((week, index) => (
          <Week
            key={`week_${week.id}`}
            index={index}
            weekId={week.id}
            weekRows={week.rows}
            boardId={workflowBoard.id}
            columnIds={workflowBoard.columns.ids}
            columnColors={workflowBoard.columns.colors}
            condensed={
              state.condensed === 'all' || state.condensed.includes(week.id)
            }
            onWeekCollapse={onWeekCollapse}
            onWeekInsert={onWeekInsert}
            onWeekReorder={onWeekReorder}
            onNodeReorder={onNodeDragEnd}
            memoBuster={[state.condensed.length, state.redrawLines]}
          />
        ))}
        <LineSVG
          rerender={state.redrawLines}
          condensed={state.condensed.length}
        />
      </WeeksWrapper>

      {/* dialogs */}
      <DeleteNodeCategoryDialog />
      <DeleteSectionDialog />
    </WorkflowEditViewWrap>
  )
}

export default memo(WorkflowEditView)
