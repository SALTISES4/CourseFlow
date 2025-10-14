import { nodelinkAdapter } from '@cfRedux/slices/nodelink.slice'
import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

export const {
  selectAll: selectAllNodelink,
  selectById: selectNodelinkById,
  selectIds: selectNodelinkByIds
} = nodelinkAdapter.getSelectors<RootState>((state) => state.workspace.nodelink)

export const selectActiveLinks = createSelector([selectAllNodelink], (links) =>
  links.filter((link) => !link.deleted)
)

export const selectIsDrawingLinkPreview = (state: RootState) => {
  return state.svglink.dragging.from !== null
}
