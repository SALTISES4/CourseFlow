import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { OuterContentWrap } from '@cf/mui/helper'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import { selectColumnById } from '@cfRedux/selectors/column.selector'
import { TColumn } from '@cfRedux/types/type'
import { AppState } from '@cfRedux/types/type'
import { produce } from 'immer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import ColumnsHeader from './components/ColumnsHeader'
import Week from './components/Week'
import * as Styled from './styles'
import {
  CellReorderCallbackFn,
  ColumnReorderCallbackFn,
  RowReorderCallbackFn,
  isGridWeek,
  isSidebarReusablePart
} from './types'
import { getWorkflowBoardData, swapInPlace } from './utility'

/*
  .workflow-canvas is used for all kinds of targeting
  nodes and nodelinks (drawn line connections between nodes) are added/rendered to the canvas and they seem to float on top of react
  it doesn't look like comments, nodes, weeks etc are part of the 3js stuff
*/
const CanvasPlaceholder = () => (
  <svg className="workflow-canvas" width="100%" height="100%">
    <defs>
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="4"
        markerHeight="4"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>
    </defs>
  </svg>
)

function getColumnColors(
  columns: {
    column: TColumn
    siblingCount: number
    columns: number[]
  }[]
): string[] {
  return columns.map((columnData) =>
    ThemeHelper.getColumnColour({
      columnType: columnData.column.columnType,
      colour: columnData.column.colour
    })
  )
}

const WorkflowEditView = () => {
  const weeksWrapperRef = useRef<HTMLDivElement>(null)
  const workflow = useSelector((state: AppState) => state.workflow)
  const [state, setState] = useState({
    condensed: false,
    columns: workflow.columns || [],
    board: getWorkflowBoardData(workflow)
  })

  useEffect(() => {
    const el = weeksWrapperRef.current
    return combine(
      // because the user can technically drag elements outside the drop container
      // we use a global monitor to reset the weeks/parts into non-condensed state
      // when a drop (or error, or drop cancel) happens
      monitorForElements({
        onDrop({ source }) {
          if (!isGridWeek(source.data) || !isSidebarReusablePart(source.data)) {
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
          return isGridWeek(source.data) || isSidebarReusablePart(source.data)
        },
        onDragStart({ source }) {
          if (!isGridWeek(source.data) || !isSidebarReusablePart(source.data)) {
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

  const onColumnReorder: ColumnReorderCallbackFn = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) {
        return
      }

      const reorderedColumns = swapInPlace(state.columns, oldIndex, newIndex)

      setState(
        produce((draft) => {
          draft.columns = reorderedColumns
        })
      )
    },
    [state.columns]
  )

  const onWeekReorder = useCallback((from: number, to: number) => {
    setState(
      produce((draft) => {
        const moved = draft.board.splice(from, 1)
        draft.board.splice(to, 0, moved[0])
      })
    )
  }, [])

  const onRowDragEnd: RowReorderCallbackFn = useCallback((from, to) => {
    setState(
      produce((draft) => {
        if (from.week === to.week) {
          // reorganizing within the same week/part
          const weekIndex = draft.board.findIndex((w) => w.id === from.week)
          const moved = draft.board[weekIndex].rows.splice(from.y, 1)
          draft.board[weekIndex].rows.splice(to.y, 0, moved[0])
        } else {
          // adding items to a different week/part
          const fromIndex = draft.board.findIndex((w) => w.id === from.week)
          const toIndex = draft.board.findIndex((w) => w.id === to.week)
          const moved = draft.board[fromIndex].rows.splice(from.y, 1)
          draft.board[toIndex].rows.splice(to.y, 0, moved[0])
        }
      })
    )
  }, [])

  const onNodeDragEnd: CellReorderCallbackFn = useCallback(
    (coords, newIndex) => {
      setState(
        produce((draft) => {
          const weekIndex = draft.board.findIndex((w) => w.id === coords.week)
          const reorderedColumns = swapInPlace(
            draft.board[weekIndex].rows[coords.y],
            coords.x,
            newIndex
          )

          draft.board[weekIndex].rows[coords.y] = reorderedColumns
        })
      )
    },
    []
  )

  const columnData = useSelector((s: AppState) =>
    state.columns.map((columnId) => selectColumnById(s, columnId))
  )

  const columnColors = getColumnColors(columnData)

  return (
    <OuterContentWrap>
      <ColumnsHeader
        columns={state.columns}
        parentId={workflow.id}
        onReorder={onColumnReorder}
      />
      <div data-test-id="weeks-block" ref={weeksWrapperRef}>
        {state.board.map((boardWeek, index) => (
          <Week
            key={`week_${boardWeek.id}`}
            weekId={boardWeek.id}
            weekRows={boardWeek.rows}
            index={index}
            parentId={workflow.id}
            columnIds={state.columns}
            columnColors={columnColors}
            condensed={state.condensed}
            onWeekReorder={onWeekReorder}
            onRowReorder={onRowDragEnd}
            onNodeReorder={onNodeDragEnd}
          />
        ))}
      </div>

      <CanvasPlaceholder />
    </OuterContentWrap>
  )
}

export default WorkflowEditView
