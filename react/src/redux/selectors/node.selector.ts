import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { getDropped } from '@cfRedux/selectors/helpers'
import { nodeAdapter } from '@cfRedux/slices/node.slice'
import { RootState } from '@cfRedux/store'
import { AppState } from '@cfRedux/types/type'

const selectId = (_: AppState, id: number) => id
const selectNodeState = (state: AppState) => state.workspace.node
const selectColumnState = (state: AppState) => state.workspace.column
const selectObjectSets = (state: AppState) => state.objectSet

/**
 * Node by ID
 */
// export const selectNodeById = createSelector(
//   [selectId, selectNodeState, selectColumnState, selectObjectSets],
//   (id, nodes, columns, objectSets) => {
//     const node = nodes.find((n) => n.id === id)
//
//     if (node) {
//       const nodeCopy = { ...node }
//       if (nodeCopy.isDropped === undefined) {
//         nodeCopy.isDropped = getDropped(id, CfObjectType.NODE) // @todo this needs work
//       }
//       const index = columns.findIndex((column) => column.id === nodeCopy.column)
//       return {
//         node: nodeCopy,
//         // we're getting a bit sloppy now, decide and unify the way entity order is passed around
//         column: {
//           ...columns.find((column, index) => column.id === nodeCopy.column),
//           order: index
//         },
//         objectSets
//       }
//     }
//     Utility.logger('no node found with id', id)
//     return
//   }
// )

export const {
  selectAll: selectAllNodes,
  selectById: selectNodeById,
  selectIds: selectNodeIds
} = nodeAdapter.getSelectors<RootState>((state) => state.workspace.node)
