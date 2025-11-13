import { RootState } from '@cfRedux/store'
import { getColumnData } from '@cfSidebar/components/AddTab/data'
import { createSelector } from 'reselect'

import { selectColumnEntities } from './column.selector'
import { selectAllNodes } from './node.selector'
import { selectAllWeeks } from './week.selector'

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
  rows: Record<number, number>[]
}

export type WorkflowBoard = {
  id: number
  columns: {
    ids: number[]
    colors: Record<number, string>
  }
  weeks: Week[]
}

// WEEK ROW EXAMPLE
// this week has 3 rows       rows = [
// #11 x: 3, y: 0               { 3: 11 },
// #22 x: 2, y: 1               { 2: 22, 3, 23 },
// #23 x: 3, y: 1               { 0: 33 }
// #33 x: 0, y: 2             ]
export const selectWorkflowBoard = createSelector(
  [
    (state: RootState) => state.workspace.workflow,
    selectAllWeeks,
    selectAllNodes,
    selectWorkflowColumnEntities
  ],
  (workflow, weekEntities, nodeEntities, columns) => {
    // prepare column colors
    const colors: WorkflowBoard['columns']['colors'] = {}
    getColumnData(columns).forEach((col) => {
      colors[col.id] = col.color
    })

    // final shape of the board
    const board: WorkflowBoard = {
      id: workflow.id,
      columns: {
        ids: columns.map((col) => col.id),
        colors
      },
      weeks: [
        ...workflow.weeks.map((id) => {
          const rows: Week['rows'] = []

          const week = weekEntities.find((w) => w.id === id)
          week.nodes.forEach((nodeId) => {
            const node = nodeEntities.find((n) => n.id === nodeId)
            const x = columns.findIndex((c) => c.id === node.column)
            const y = node.order

            // place the node into the corresponding row/cell
            if (!rows[y]) {
              rows[y] = { [x]: nodeId }
            } else {
              if (rows[y][x]) {
                console.log(
                  `node overwrite at week #${id} ${y}/${x} by node #${nodeId}`
                )
              }

              // assign the node anyway
              rows[y][x] = nodeId
            }
          })

          return { id, rows }
        })
      ]
    }

    return board
  }
)
