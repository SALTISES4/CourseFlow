import { SliceNamespace } from '@cf/redux/types/enumActions'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { Position } from '@xyflow/react'

export type DragPosition = {
  nodeId: number | null
  x: number
  y: number
  edge: Position | null
}

type SVGLinkState = {
  dragging: {
    from: DragPosition | null
    to: DragPosition | null
  }
  editing: LineEdit['editing'] | null
}

type LineEdit = {
  from: DragPosition
  to: DragPosition
  editing: 'from' | 'to'
}

const initialState: SVGLinkState = {
  dragging: { from: null, to: null },
  editing: null
}

const svgLinkSlice = createSlice({
  name: SliceNamespace.SVGLINK,
  initialState,
  reducers: {
    dragStart(state, action: PayloadAction<DragPosition>) {
      state.dragging.from = action.payload
    },
    dragMove(state, action: PayloadAction<DragPosition>) {
      state.dragging.to = action.payload
    },
    dragEnd(state) {
      state.dragging.from = null
      state.dragging.to = null
      state.editing = null
    },
    lineEdit(state, action: PayloadAction<LineEdit>) {
      state.dragging.from = action.payload.from
      state.dragging.to = action.payload.to
      state.editing = action.payload.editing
    }
  }
})

export default svgLinkSlice.reducer

export const {
  dragStart: svglinkDragStart,
  dragMove: svglinkDragMove,
  dragEnd: svglinkDragEnd,
  lineEdit: svglinkLineEdit
} = svgLinkSlice.actions
