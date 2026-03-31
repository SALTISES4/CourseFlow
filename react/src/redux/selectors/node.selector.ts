import { nodeAdapter } from '@cfRedux/slices/node.slice'
import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

export const {
  selectAll: selectAllNodes,
  selectById: selectNodeById,
  selectIds: selectNodeIds
} = nodeAdapter.getSelectors<RootState>((state) => state.workspace.node)

export const selectNodeColumn = (nodeid: string) =>
  createSelector(
    (state: RootState) => state.workspace.node.entities[nodeId],
    (node) => node.column
  )
