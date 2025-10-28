import { SliceNamespace } from '@cf/redux/types/enumActions'
import { PayloadAction, createAction, createSlice } from '@reduxjs/toolkit'
import { Position } from '@xyflow/react'

import { AppDispatch, RootState } from '../store'

export const svglinkDragEnd = createAction<SVGLinkState['dragging']>(
  'svgLink/svglinkDragEnd'
)

export const dragEndThunk =
  () => (dispatch: AppDispatch, getState: () => RootState) => {
    const { id, from, to } = getState().svglink.dragging
    dispatch(svglinkDragEnd({ id, from, to }))
  }

export type DragPosition = {
  nodeId: number | null
  x: number
  y: number
  edge: Position | null
}

type SVGLinkState = {
  dragging: {
    id: number | null
    from: DragPosition | null
    to: DragPosition | null
  }
  editing: LineEdit['editing'] | null
}

type LineEdit = {
  id: number
  from: DragPosition
  to: DragPosition
  editing: 'from' | 'to'
}

const initialState: SVGLinkState = {
  dragging: { id: null, from: null, to: null },
  editing: null
}

const svgLinkSlice = createSlice({
  name: SliceNamespace.SVGLINK,
  initialState,
  reducers: {
    dragStart(state, action: PayloadAction<DragPosition>) {
      state.dragging.id = null
      state.dragging.from = action.payload
    },
    dragMove(state, action: PayloadAction<DragPosition>) {
      state.dragging.to = action.payload
    },
    snapTarget(
      state,
      action: PayloadAction<{
        id: number
        edge: Position
        editing: LineEdit['editing']
      }>
    ) {
      const { id, edge, editing } = action.payload
      const target = state.dragging[editing]
      target.nodeId = id
      target.edge = edge

      console.log('set the snap target to', action.payload)
    },
    lineEdit(state, action: PayloadAction<LineEdit>) {
      state.dragging.id = action.payload.id
      state.dragging.from = action.payload.from
      state.dragging.to = action.payload.to
      state.editing = action.payload.editing
    }
  },
  extraReducers: (builder) => {
    builder.addCase(svglinkDragEnd, (state, action) => {
      state.dragging.id = null
      state.dragging.from = null
      state.dragging.to = null
      state.editing = null
    })
  }
})

export default svgLinkSlice.reducer

export const {
  dragStart: svglinkDragStart,
  dragMove: svglinkDragMove,
  lineEdit: svglinkLineEdit
} = svgLinkSlice.actions
