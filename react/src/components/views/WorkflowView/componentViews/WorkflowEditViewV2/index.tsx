import { OuterContentWrap } from '@cf/mui/helper'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import { selectColumnById } from '@cfRedux/selectors/column.selector'
import { TColumn } from '@cfRedux/types/type'
import { AppState } from '@cfRedux/types/type'
import ColumnWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/column/ColumnWrapper'
import WorkflowFunctions from '@cfViews/WorkflowView/componentViews/WorkflowEditView/workflow.actions.class'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { produce } from 'immer'
import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'

import Week from './components/Week'
import * as Styled from './styles'

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
  const workflow = useSelector((state: AppState) => state.workflow)

  const [state, setState] = useState({
    columns: workflow.columns || [],
    weeks: workflow.weeks || [],
    weekReordering: false
  })

  const toggleWeekReordering = useCallback(() => {
    setState(
      produce((draft) => {
        draft.weekReordering = !draft.weekReordering
      })
    )
  }, [])

  const onDragEnd = (event: DragEndEvent, type: 'column' | 'week') => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const stateSource = type === 'column' ? state.columns : state.weeks
    const oldIndex = stateSource.indexOf(active.id as number)
    const newIndex = stateSource.indexOf(over.id as number)
    const reorderedColumns = WorkflowFunctions.reorderArray(
      stateSource,
      oldIndex,
      newIndex
    )

    setState(
      produce((draft) => {
        if (type === 'column') {
          draft.columns = reorderedColumns
        } else {
          draft.weeks = reorderedColumns
        }
      })
    )
  }

  const columnData = useSelector((s: AppState) =>
    state.columns.map((columnId) => selectColumnById(s, columnId))
  )

  const columns = state.columns.map((columnId) => (
    <ColumnWrapper
      key={`columnworkflow-${columnId}`}
      objectId={columnId}
      parentId={workflow.id}
    />
  ))

  const weeks = state.weeks.map((weekId) => (
    <Week
      key={`weekworkflow-${weekId}`}
      objectId={weekId}
      parentId={workflow.id}
      reordering={state.weekReordering}
      columnColors={getColumnColors(columnData)}
    />
  ))

  return (
    <OuterContentWrap>
      <Styled.CellRow data-test-id="columns-block">
        <DndContext onDragEnd={(e: DragEndEvent) => onDragEnd(e, 'column')}>
          <SortableContext
            items={state.columns}
            strategy={horizontalListSortingStrategy}
          >
            {columns}
          </SortableContext>
        </DndContext>
      </Styled.CellRow>

      <Box sx={{ my: 3 }}>
        <Button
          variant={state.weekReordering ? 'contained' : 'outlined'}
          onClick={toggleWeekReordering}
        >
          {_t(state.weekReordering ? 'Save' : 'Reorder Weeks')}
        </Button>
      </Box>

      <div data-test-id="weeks-block">
        {state.weekReordering ? (
          <DndContext onDragEnd={(e: DragEndEvent) => onDragEnd(e, 'week')}>
            <SortableContext
              items={state.weeks}
              strategy={verticalListSortingStrategy}
            >
              {weeks}
            </SortableContext>
          </DndContext>
        ) : (
          weeks
        )}
      </div>

      <CanvasPlaceholder />
    </OuterContentWrap>
  )
}

export default WorkflowEditView
