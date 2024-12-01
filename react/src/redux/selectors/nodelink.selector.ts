import { nodelinkAdapter } from '@cfRedux/slices/nodelink.slice'
import { RootState } from '@cfRedux/store'

// export const selectNodeLinkById = createSelector(
//   [selectId, getAllNodeLinks],
//   (id, nodelinks) => {
//     const nodelink = nodelinks.find((nl) => nl.id === id)
//     if (nodelink) {
//       return nodelink
//     }
//     Utility.logger('no nodelink found with id', id)
//     return
//   }
// )

export const {
  selectAll: selectAllNodelink,
  selectById: selectNodelinkById,
  selectIds: selectNodelinkByIds
} = nodelinkAdapter.getSelectors<RootState>((state) => state.workspace.nodelink)
