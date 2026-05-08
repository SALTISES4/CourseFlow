import { RootState } from '@cfRedux/store'
import { getChannelData } from '@cfSidebar/components/AddTab/data'
import { createSelector } from 'reselect'

import { selectColumnEntities } from './column.selector'
import { selectAllNodes } from './node.selector'

// grabs columns associated to the current workflow
export const selectWorkflowColumns = (state: RootState): number[] => {
  return state.workspace.workflow.columns
}

// filters through the columns
// (some of them might be soft deleted too and wouldn't appear)
// TODO: maybe this is unnecessary if soft delete is being removed
export const selectWorkflowColumnEntities = createSelector(
  [selectWorkflowColumns, selectColumnEntities],
  (columnIds, columnEntities) => {
    return columnIds.map((id) => columnEntities[id]).filter(Boolean)
  }
)

type Section = {
  uuid: string
  rows: Record<string, string>[]
}

export type WorkflowBoard = {
  uuid: string
  columns: {
    ids: string[]
    colors: Record<string, string>
  }
  sections: Section[]
}

// WEEK ROW EXAMPLE
// this section has 3 rows       rows = [
// #11 x: 3, y: 0               { 3: 11 },
// #22 x: 2, y: 1               { 2: 22, 3, 23 },
// #23 x: 3, y: 1               { 0: 33 }
// #33 x: 0, y: 2             ]
export const selectWorkflowBoard = createSelector(
  [
    (state: RootState) => state.workspace.workflow,
    selectAllNodes,
    selectWorkflowColumnEntities
  ],
  (workflow, nodes, columns) => {
    // prepare column colors
    const colors: WorkflowBoard['columns']['colors'] = {}
    getChannelData(columns).forEach((col) => {
      colors[col.uuid] = col.color
    })

    // final shape of the board
    const board: WorkflowBoard = {
      uuid: workflow.uuid,
      columns: {
        ids: columns.map((col) => col.uuid),
        colors
      },
      sections: workflow.sections.map((sectionId) => {
        const rows: Section['rows'] = []
        const sectionNodes = nodes.filter(
          (n) => n.section === sectionId && !n.deleted
        )
        sectionNodes
          .sort((a, b) => a.order - b.order)
          .forEach((node) => {
            const x = columns.findIndex(
              (c) => c.uuid === node.column.toString()
            )
            const y = node.order

            // place the node into the corresponding row/cell
            if (!rows[y]) {
              rows[y] = { [x]: node.uuid }
            } else {
              // there can technically be an overwrite
              if (rows[y][x]) {
                console.log(
                  `node overwrite at section #${sectionId} ${y}/${x} node id #${node.uuid} replacing #${rows[y][x]}`
                )
              }

              // assign the node anyway
              rows[y][x] = node.uuid
            }
          })

        return {
          uuid: sectionId.toString(),
          rows
        }
      })
    }

    return board
  }
)
