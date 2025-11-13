import { RootState } from '@cfRedux/store'
import { getColumnData } from '@cfSidebar/components/AddTab/data'
import { createSelector } from 'reselect'

import { selectColumnEntities } from './column.selector'

// grabs columns associated to the current workflow
export const selectWorkflowColumns = (state: RootState): number[] => {
  return state.workspace.workflow.columns
}

// filters through the columns
// (some of them might be soft deleted too and wouldn't appear)
// maybe this is unnecessary if soft delete is being removed
const selectWorkflowColumnEntities = createSelector(
  [selectWorkflowColumns, selectColumnEntities],
  (columnIds, columnEntities) => {
    return columnIds.map((id) => columnEntities[id]).filter(Boolean)
  }
)

type Week = {
  id: number
  rows: (number | null)[]
}

export type WorkflowBoard = {
  id: number
  dragging: boolean

  columns: {
    ids: number[]
    colors: Record<number, string>
  }
  weeks: Week[]
}

export const selectWorkflowBoard = createSelector(
  [
    (state: RootState) => state.workspace.workflow,
    (state: RootState) => state.svglink.allowDnd,
    selectWorkflowColumnEntities
  ],
  (workflow, dragging, columns) => {
    // prepare column colors
    const colors: WorkflowBoard['columns']['colors'] = {}
    getColumnData(columns).forEach((col) => {
      colors[col.id] = col.color
    })

    // final shape of the board
    const board: WorkflowBoard = {
      id: workflow.id,
      dragging,
      columns: {
        ids: columns.map((col) => col.id),
        colors
      },
      weeks: [...workflow.weeks.map((w) => ({ id: w, rows: [] }))]
    }

    return board
  }
)
