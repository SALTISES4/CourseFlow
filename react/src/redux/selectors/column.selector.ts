import Utility from '@cf/utility/Utility.class'
import { createSelector } from '@reduxjs/toolkit' // or import from 'reselect' if not using Redux Toolkit

import { AppState } from '../types/type'

const selectId = (_: AppState, id: number) => id
const getColumns = (state: AppState) => state.workflow.columns
const getColumnMap = (state: AppState) => state.column
// const getColumnWorkflowById = (state: AppState, id: number) =>
//   getColumnWorkflowByID(state, id).data.column

// Main selector using createSelector
export const getColumnById = createSelector(
  [selectId, getColumnMap, getColumns],
  (id, columnMap, columns) => {
    const column = columnMap[id]
    if (column) {
      return {
        column: column,
        siblingCount: columns.length,
        columns: columns,
        // columnOrder: columns.map((columnWorkflowId) =>
        //   getColumnWorkflowById(columnWorkflowId)
        // )
      }
    }
    Utility.logger('no column found with id', id)
    return
  }
)

// export const getColumnById = (state: AppState, id: number): TGetColumnByID => {
//   for (const i in state.column) {
//     const column = state.column[i]
//     if (column.id == id) {
//       return {
//         column: column,
//         siblingCount: state.workflow.columns.length,
//         columns: state.workflow.columns,
//         columnOrder: state.workflow.columns.map(
//           (columnworkflowId) =>
//             getColumnWorkflowByID(state, columnworkflowId).data.column
//         )
//       }
//     }
//   }
//   Utility.logger('no column found with id', id)
// }

// export const getNodeById = createSelector(
//   [selectId, selectNodeState, selectColumnState, selectObjectSets],
//   (id, nodes, columns, objectSets) => {
//     const node = nodes.find((n) => n.id === id)
//
//     if (node) {
//       const nodeCopy = { ...node } // Shallow copy to avoid mutation
//       if (nodeCopy.isDropped === undefined) {
//         nodeCopy.isDropped = getDropped(id, CfObjectType.NODE) // @todo this needs work
//       }
//
//       return {
//         node: nodeCopy,
//         column: columns.find((column) => column.id === nodeCopy.column),
//         objectSets
//       }
//     }
//
//     return null
//   }
// )
