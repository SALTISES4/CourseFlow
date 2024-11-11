import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { getDropped } from '@cfRedux/selectors/helpers'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectId = (_: AppState, id: number) => id
const selectNodeState = (state: AppState) => state.node
const selectColumnState = (state: AppState) => state.column
const selectObjectSets = (state: AppState) => state.objectset
/**
 * Memoized selector to find a node by ID.
 */
export const getNodeById = createSelector(
  [selectId, selectNodeState, selectColumnState, selectObjectSets],
  (id, nodes, columns, objectSets) => {
    const node = nodes.find((n) => n.id === id)

    if (node) {
      const nodeCopy = { ...node } // Shallow copy to avoid mutation
      if (nodeCopy.isDropped === undefined) {
        nodeCopy.isDropped = getDropped(id, CfObjectType.NODE) // @todo this needs work
      }

      return {
        node: nodeCopy,
        column: columns.find((column) => column.id === nodeCopy.column),
        objectSets
      }
    }
    Utility.logger('no node found with id', id)
    return
  }
)
