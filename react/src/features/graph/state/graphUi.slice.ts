import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { EdgeKey, GraphUiState, ResourceUuid } from './model/types'

const initialState: GraphUiState = {
  selectedNodeUuid: null,
  selectedEdgeId: null,
  hoveredNodeUuid: null,
  hoveredEdgeId: null,
  activePanel: 'none',
  edgeDraft: {
    sourceNodeUuid: null,
    sourcePort: null,
    targetNodeUuid: null,
    targetPort: null
  }
}

const graphUiSlice = createSlice({
  name: 'graph/graphUi',
  initialState,
  reducers: {
    selectNode(state, action: PayloadAction<ResourceUuid | null>) {
      state.selectedNodeUuid = action.payload
      if (action.payload !== null) {
        state.selectedEdgeId = null
      }
    },
    selectEdge(state, action: PayloadAction<EdgeKey | null>) {
      state.selectedEdgeId = action.payload
      if (action.payload !== null) {
        state.selectedNodeUuid = null
      }
    },
    setHoveredNode(state, action: PayloadAction<ResourceUuid | null>) {
      state.hoveredNodeUuid = action.payload
    },
    setHoveredEdge(state, action: PayloadAction<EdgeKey | null>) {
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
