import { nodelinkAdapter } from '@cfRedux/slices/nodelink.slice'
import { RootState } from '@cfRedux/store'

export const {
  selectAll: selectAllNodelink,
  selectById: selectNodelinkById,
  selectIds: selectNodelinkByIds
} = nodelinkAdapter.getSelectors<RootState>((state) => state.workspace.nodelink)
