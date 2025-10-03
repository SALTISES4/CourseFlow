import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { OuterContentWrap } from '@cf/mui/helper'
import { selectWorkflowColumns } from '@cf/redux/selectors/column.selector'
import { workflowMoveColumns } from '@cf/redux/slices/workflow.slice'
import { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
import { getColumnData } from '@cfSidebar/components/AddTab/data'
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

import ColumnsHeader from './components/ColumnsHeader'
import LineSVG from './components/LineSVG'
import Week from './components/Week'
import {
  CellReorderCallbackFn,
  ColumnReorderCallbackFn,
  RowReorderCallbackFn,
  isGridWeek,
  isSidebarPart
} from './types'

const WorkflowEditView = () => {
  const dispatch = useDispatch()
  const weeksWrapperRef = useRef<HTMLDivElement>(null)
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  const workflowColumns = useSelector(selectWorkflowColumns)
  const columnColors = getColumnData(workflowColumns).map((col) => col.color)
  const [state, setState] = useState({
    condensed: false,
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
              draft.condensed = false
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
              draft.condensed = true
            })
          )
        }
      })
    )
  }, [])

  // update redraw state to retrigger LineSVG to render with correct DOM rects
  useLayoutEffect(() => {
    setState(
      produce((draft) => {
        draft.redrawLines = !draft.redrawLines
      })
    )
  }, [workflow.columns])

  const onColumnReorder: ColumnReorderCallbackFn = useCallback(
    (oldIndex: number, newIndex: number) => {
      dispatch(workflowMoveColumns({ moveIndex: oldIndex, toIndex: newIndex }))
    },
    [dispatch]
  )

  const onWeekInsert = useCallback((insertIndex: number) => {
    console.log('+++ WEEK INSERT', { insertIndex })
    // setState(
    //   produce((draft) => {
    //     const clone = draft.board[0]
    //     draft.board.splice(insertIndex, 0, clone)
    //   })
    // )
  }, [])

  const onWeekReorder = useCallback((from: number, to: number) => {
    console.log('+++ WEEK REORDER', { from, to })
    // setState(
    //   produce((draft) => {
    //     const moved = draft.board.splice(from, 1)
    //     draft.board.splice(to, 0, moved[0])
    //   })
    // )
  }, [])

  const onRowDragEnd: RowReorderCallbackFn = useCallback((from, to) => {
    console.log('+++ ROW dragend', { from, to })
    // setState(
    //   produce((draft) => {
    //     if (from.week === to.week) {
    //       // reorganizing within the same week/part
    //       const weekIndex = draft.board.findIndex((w) => w.id === from.week)
    //       const moved = draft.board[weekIndex].rows.splice(from.y, 1)
    //       draft.board[weekIndex].rows.splice(to.y, 0, moved[0])
    //     } else {
    //       // adding items to a different week/part
    //       const fromIndex = draft.board.findIndex((w) => w.id === from.week)
    //       const toIndex = draft.board.findIndex((w) => w.id === to.week)
    //       const moved = draft.board[fromIndex].rows.splice(from.y, 1)
    //       draft.board[toIndex].rows.splice(to.y, 0, moved[0])
    //     }
    //   })
    // )
  }, [])

  const onNodeDragEnd: CellReorderCallbackFn = useCallback(
    (coords, newIndex) => {
      console.log('+++ NODE dragend', { coords, newIndex })
      // setState(
      //   produce((draft) => {
      //     const weekIndex = draft.board.findIndex((w) => w.id === coords.week)
      //     const reorderedColumns = swapInPlace(
      //       draft.board[weekIndex].rows[coords.y],
      //       coords.x,
      //       newIndex
      //     )

      //     draft.board[weekIndex].rows[coords.y] = reorderedColumns
      //   })
      // )
    },
    []
  )

  return (
    <OuterContentWrap>
      <ColumnsHeader
        columns={workflow.columns}
        parentId={workflow.id}
        onReorder={onColumnReorder}
      />
      <div
        data-test-id="weeks-block"
        ref={weeksWrapperRef}
        style={{ position: 'relative' }}
      >
        {workflow.weeks.map((weekId, index) => (
          <Week
            key={`week_${weekId}`}
            weekId={weekId}
            index={index}
            parentId={workflow.id}
            columnIds={workflow.columns}
            columnColors={columnColors}
            condensed={state.condensed}
            onWeekInsert={onWeekInsert}
            onWeekReorder={onWeekReorder}
            onRowReorder={onRowDragEnd}
            onNodeReorder={onNodeDragEnd}
          />
        ))}
        <LineSVG />
      </div>
    </OuterContentWrap>
  )
}

export default memo(WorkflowEditView)
