import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { OuterContentWrap } from '@cf/mui/helper'
import { selectWorkflowColumns } from '@cf/redux/selectors/column.selector'
import { nodeChangedColumn } from '@cf/redux/slices/node.slice'
import { weekMoveNodes } from '@cf/redux/slices/week.slice'
import {
  workflowReorderColumns,
  workflowReorderWeeks
} from '@cf/redux/slices/workflow.slice'
import { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
import { getColumnData } from '@cfSidebar/components/AddTab/data'
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
  const columnIds = useMemo(() => workflow.columns, [workflow.columns])
  const columnColors: Record<number, string> = useMemo(() => {
    const colors: Record<number, string> = {}
    getColumnData(workflowColumns).forEach((col) => {
      colors[col.id] = col.color
    })
    return colors
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowColumns.map((col) => `${col.id}_${col.colour}`).join(',')])

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
  }, [columnIds])

  const onColumnReorder: ColumnReorderCallbackFn = useCallback(
    (oldIndex: number, newIndex: number) => {
      dispatch(
        workflowReorderColumns({ moveIndex: oldIndex, toIndex: newIndex })
      )
    },
    [dispatch]
  )

  const onWeekInsert = useCallback((insertIndex: number) => {
    console.log('+++ WEEK INSERT', { insertIndex })
    // TODO: figure out how sidebar parts/strategies work
    // dispatch workflow week insert
    // state.weeks.splice(insertIndex, 0, dataForTheInsertedWeek)
  }, [])

  const onWeekReorder = useCallback(
    (from: number, to: number) => {
      dispatch(workflowReorderWeeks({ fromIndex: from, toIndex: to }))
    },
    [dispatch]
  )

  const onRowDragEnd: RowReorderCallbackFn = useCallback(
    (from, to) => {
      dispatch(
        weekMoveNodes({
          from: {
            weekId: from.week,
            index: from.y
          },
          to: {
            weekId: to.week,
            index: to.y
          }
        })
      )
    },
    [dispatch]
  )

  const onNodeDragEnd: CellReorderCallbackFn = useCallback(
    (id, week, columnId) => {
      dispatch(
        nodeChangedColumn({
          id,
          data: { column: columnId }
        })
      )
    },
    [dispatch]
  )

  return (
    <OuterContentWrap>
      <ColumnsHeader
        columns={columnIds}
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
            columnIds={columnIds}
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
