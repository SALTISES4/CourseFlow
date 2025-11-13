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
  rows: (null | number)[][]
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
    selectAllWeeks,
    selectAllNodes,
    (state: RootState) => state.svglink.allowDnd,
    selectWorkflowColumnEntities
  ],
  (workflow, weekEntities, nodeEntities, dragging, columns) => {
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
      weeks: [
        ...workflow.weeks.map((id) => {
          const rows: Week['rows'] = []

          // grab the nodes from the week
          const week = weekEntities.find((w) => w.id === id)
          if (week) {
            week.nodes.forEach((nodeId) => {
              const node = nodeEntities.find((n) => n.id === nodeId)
              const nodeX = columns.findIndex((c) => c.id === node.column)
              const nodeY = node.order
              console.log('node', nodeId, 'x', nodeX, 'y', nodeY)
            })
          }

          return { id, rows }
        })
      ]
    }

    return board
  }
)
