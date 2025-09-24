import { nodeAdapter } from '@cfRedux/slices/node.slice'
import { RootState } from '@cfRedux/store'

export const {
  selectAll: selectAllNodes,
  selectById: selectNodeById,
  selectIds: selectNodeIds
} = nodeAdapter.getSelectors<RootState>((state) => state.workspace.node)
