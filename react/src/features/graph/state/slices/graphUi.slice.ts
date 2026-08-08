import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { EdgeKey, GraphUiState, ResourceUuid } from '../model/types'
import { DEFAULT_NODE_INSERT_MODE } from '../nodeInsertModePreference'
import type { NodeInsertMode } from '../resolveNodeDropRow'

const initialState: GraphUiState = {
  selectedNodeUuid: null,
  selectedEdgeId: null,
  hoveredNodeUuid: null,
  hoveredEdgeId: null,
  activePanel: 'none',
  nodeInsertMode: DEFAULT_NODE_INSERT_MODE,
  collapsedSectionUuids: [],
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
    setNodeInsertMode(state, action: PayloadAction<NodeInsertMode>) {
      state.nodeInsertMode = action.payload
    },
    setCollapsedSectionUuids(state, action: PayloadAction<ResourceUuid[]>) {
      state.collapsedSectionUuids = action.payload
    },
    toggleSectionCollapsed(state, action: PayloadAction<ResourceUuid>) {
      const index = state.collapsedSectionUuids.indexOf(action.payload)
      if (index === -1) {
        state.collapsedSectionUuids.push(action.payload)
      } else {
        state.collapsedSectionUuids.splice(index, 1)
      }
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
