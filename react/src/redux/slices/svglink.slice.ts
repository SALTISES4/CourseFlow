import { SliceNamespace } from '@cf/redux/types/enumActions'
import { PayloadAction, createAction, createSlice } from '@reduxjs/toolkit'
import { Position } from '@xyflow/react'

import { AppDispatch, RootState } from '../store'

export const svglinkDragEnd = createAction<{
  id: string
  from: SVGLinkState['snap']['from']
  to: SVGLinkState['snap']['to']
}>('svgLink/svglinkDragEnd')

export const dragEndThunk =
  () => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().svglink
    dispatch(
      svglinkDragEnd({
        id: state.dragging.id,
        from: state.snap.from,
        to: state.snap.to
      })
    )
  }

export type DragPosition = {
  nodeid: string | null
  x: number
  y: number
  edge: Position | null
}

type SVGLinkState = {
  dragging: {
    id: string | null
    from: DragPosition | null
    to: DragPosition | null
  }
  snap: {
    from: { nodeid: string; edge: Position } | null
    to: { nodeid: string; edge: Position } | null
  }
  editing: LineEdit['editing'] | null

  // turn on workflow view pragmatic element pointer events
  // so that the drag'n'drop functionality works properly
  allowDnd: boolean
}

type LineEdit = {
  id: string
  from: DragPosition
  to: DragPosition
  editing: 'from' | 'to'
}

const initialState: SVGLinkState = {
  dragging: { id: null, from: null, to: null },
  snap: { from: null, to: null },
  editing: null,
  allowDnd: false
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
    dragSnap(
      state,
      action: PayloadAction<{
        id: string
        edge: Position
        editing: LineEdit['editing']
      }>
    ) {
      const { id, edge, editing } = action.payload
      const fromId = state.dragging.from?.nodeId ?? null
      const fromEdge = state.dragging.from?.edge ?? null
      const toId = state.dragging.to?.nodeId ?? null
      const toEdge = state.dragging.to?.edge ?? null

      const snap: SVGLinkState['snap'] = {
        from: { nodeId: fromId, edge: fromEdge },
        to: { nodeId: toId, edge: toEdge }
      }

      state.snap = snap

      const target = state.snap[editing]
      if (target) {
        target.nodeId = id
        target.edge = edge
      }
    },
    lineEdit(state, action: PayloadAction<LineEdit>) {
      state.dragging.id = action.payload.id
      state.dragging.from = action.payload.from
      state.dragging.to = action.payload.to
      state.editing = action.payload.editing
    },
    allowDragDrop(state, action: PayloadAction<boolean>) {
      state.allowDnd = action.payload
    }
  },
  extraReducers: (builder) => {
    builder.addCase(svglinkDragEnd, (state, action) => {
      state.dragging.id = null
      state.dragging.from = null
      state.dragging.to = null
      state.snap.from = null
      state.snap.to = null
      state.editing = null
    })
  }
})

export default svgLinkSlice.reducer

export const {
  dragStart: svglinkDragStart,
  dragMove: svglinkDragMove,
  dragSnap: svglinkDragSnap,
  lineEdit: svglinkLineEdit,
  allowDragDrop: svglinkAllowDND
} = svgLinkSlice.actions
