import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { getDropped } from '@cfRedux/selectors/helpers'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectId = (_: AppState, id: number) => id
const selectNodeState = (state: AppState) => state.workspace.node
const selectColumnState = (state: AppState) => state.workspace.column
const selectObjectSets = (state: AppState) => state.objectset

/**
 * Node by ID
 */
export const selectNodeById = createSelector(
  [selectId, selectNodeState, selectColumnState, selectObjectSets],
  (id, nodes, columns, objectSets) => {
    const node = nodes.find((n) => n.id === id)

    if (node) {
      const nodeCopy = { ...node }
      if (nodeCopy.isDropped === undefined) {
        nodeCopy.isDropped = getDropped(id, CfObjectType.NODE) // @todo this needs work
      }
      const index = columns.findIndex((column) => column.id === nodeCopy.column)
      return {
        node: nodeCopy,
        // we're getting a bit sloppy now, decide and unify the way entity order is passed around
        column: {
          ...columns.find((column, index) => column.id === nodeCopy.column),
          order: index
        },
        objectSets
      }
    }
    Utility.logger('no node found with id', id)
    return
  }
)
