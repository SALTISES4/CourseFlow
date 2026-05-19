import { svglinkDragEnd } from '@cf/features/graph/state/slices/svglink.slice'
import { AppDispatch, RootState } from '@cfRedux/store'

export const dragEndThunk =
  () => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().svglink
    dispatch(
      svglinkDragEnd({
        uuid: state.dragging.uuid,
        from: state.snap.from,
        to: state.snap.to
      })
    )
  }
