import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { EntityId, GraphUiState } from './model/types'

const initialState: GraphUiState = {
  selectedNodeId: null,
  selectedEdgeId: null,
  hoveredNodeId: null,
  hoveredEdgeId: null,
  activePanel: 'none',
  edgeDraft: {
    sourceNodeId: null,
    sourcePort: null,
    targetNodeId: null,
    targetPort: null
  }
}

const graphUiSlice = createSlice({
  name: 'graph/graphUi',
  initialState,
  reducers: {
    selectNode(state, action: PayloadAction<EntityId | null>) {
      state.selectedNodeId = action.payload
      if (action.payload !== null) {
        state.selectedEdgeId = null
      }
    },
    selectEdge(state, action: PayloadAction<EntityId | null>) {
      state.selectedEdgeId = action.payload
      if (action.payload !== null) {
        state.selectedNodeId = null
      }
    },
    setHoveredNode(state, action: PayloadAction<EntityId | null>) {
      state.hoveredNodeId = action.payload
    },
    setHoveredEdge(state, action: PayloadAction<EntityId | null>) {
      state.hoveredEdgeId = action.payload
    },
    setActivePanel(state, action: PayloadAction<GraphUiState['activePanel']>) {
      state.activePanel = action.payload
    },
    setEdgeDraft(state, action: PayloadAction<GraphUiState['edgeDraft']>) {
      state.edgeDraft = action.payload
    },
    clearEdgeDraft(state) {
      state.edgeDraft = initialState.edgeDraft
    },
    clearUiState() {
      return initialState
    }
  }
})

export const graphUiReducer = graphUiSlice.reducer
export const graphUiActions = graphUiSlice.actions
