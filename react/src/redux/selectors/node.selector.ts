import { CfObjectType } from '@cf/types/enum'
import { getDropped } from '@cfRedux/selectors/helpers'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectNodeState = (state: AppState) => state.node
const selectNodeId = (_: AppState, id: number) => id
const selectColumnState = (state: AppState) => state.column
const selectObjectSets = (state: AppState) => state.objectset

/**
 * Memoized selector to find a node by ID.
 */
export const getNodeById = createSelector(
  [selectNodeState, selectNodeId, selectColumnState, selectObjectSets],
  (nodes, id, columns, objectSets) => {
    const node = nodes.find((n) => n.id === id)

    if (node) {
      const nodeCopy = { ...node } // Shallow copy to avoid mutation
      if (nodeCopy.isDropped === undefined) {
        nodeCopy.isDropped = getDropped(id, CfObjectType.NODE)
      }

      return {
        data: nodeCopy,
        column: columns.find((column) => column.id === nodeCopy.column),
        objectSets
      }
    }

    return null
  }
)
