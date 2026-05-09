import { RootState } from '@cfRedux/store'

/** True while the user is dragging a new link preview from a node handle. */
export const selectIsDrawingLinkPreview = (state: RootState) =>
  state.svglink.dragging.from !== null
