import { SliceNamespace } from '../../../../redux/types/enum'
import { PayloadAction, createAction, createSlice } from '@reduxjs/toolkit'
import { Position } from '@xyflow/react'

export const svglinkDragEnd = createAction<{
  uuid: string | null
  from: SVGLinkState['snap']['from']
  to: SVGLinkState['snap']['to']
}>('svglink/svglinkDragEnd')

export type DragPosition = {
  nodeUuid: string | null
  x: number
  y: number
  edge: Position | null
}

type SVGLinkState = {
  dragging: {
    uuid: string | null
    from: DragPosition | null
    to: DragPosition | null
  }
  snap: {
    from: { nodeUuid: string; edge: Position } | null
    to: { nodeUuid: string; edge: Position } | null
  }
  editing: LineEdit['editing'] | null

  // turn on workflow view pragmatic element pointer events
  // so that the drag'n'drop functionality works properly
  allowDnd: boolean
}

type LineEdit = {
  uuid: string
  from: DragPosition
  to: DragPosition
  editing: 'from' | 'to'
}

const initialState: SVGLinkState = {
  dragging: { uuid: null, from: null, to: null },
  snap: { from: null, to: null },
  editing: null,
  allowDnd: false
}

const svglinkSlice = createSlice({
  name: SliceNamespace.SVGLINK,
  initialState,
  reducers: {
    dragStart(state, action: PayloadAction<DragPosition>) {
      state.dragging.uuid = null
      state.dragging.from = action.payload
    },
    dragMove(state, action: PayloadAction<DragPosition>) {
      state.dragging.to = action.payload
    },
    dragSnap(
      state,
      action: PayloadAction<{
        uuid: string
        edge: Position
        editing: LineEdit['editing']
      }>
    ) {
      const { uuid, edge, editing } = action.payload
      const fromId = state.dragging.from?.nodeUuid ?? null
      const fromEdge = state.dragging.from?.edge ?? null
      const toId = state.dragging.to?.nodeUuid ?? null
      const toEdge = state.dragging.to?.edge ?? null

      const snap: SVGLinkState['snap'] = {
        from: fromId && fromEdge ? { nodeUuid: fromId, edge: fromEdge } : null,
        to: toId && toEdge ? { nodeUuid: toId, edge: toEdge } : null
      }

      state.snap = snap

      const target = state.snap[editing]
      if (target) {
        target.nodeUuid = uuid
        target.edge = edge
      }
    },
    lineEdit(state, action: PayloadAction<LineEdit>) {
      state.dragging.uuid = action.payload.uuid
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
      state.dragging.uuid = null
      state.dragging.from = null
      state.dragging.to = null
      state.snap.from = null
      state.snap.to = null
      state.editing = null
    })
  }
})

export default svglinkSlice.reducer

export const {
  dragStart: svglinkDragStart,
  dragMove: svglinkDragMove,
  dragSnap: svglinkDragSnap,
  lineEdit: svglinkLineEdit,
  allowDragDrop: svglinkAllowDND
} = svglinkSlice.actions
