import { nodelinkAdapter } from '@cfRedux/slices/nodelink.slice'
import { RootState } from '@cfRedux/store'
import { AppState } from '@cfRedux/types/type'

export const {
  selectAll: selectAllNodelink,
  selectById: selectNodelinkById,
  selectIds: sselectNodelinkByIds
} = nodelinkAdapter.getSelectors<RootState>((state) => state.workspace.nodelink)
