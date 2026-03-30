import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type {
  GraphLoadStatus,
  GraphResourceLoadState,
  WorkflowId
} from './model/types'

type GraphLoadState = {
  byWorkflowId: Record<WorkflowId, GraphResourceLoadState>
}

const makeInitialResourceState = (): GraphResourceLoadState => ({
  workflowMeta: 'idle',
  sections: 'idle',
  channels: 'idle',
  nodes: 'idle',
  edges: 'idle',
  tags: 'idle'
})

const initialState: GraphLoadState = {
  byWorkflowId: {}
}

const graphLoadSlice = createSlice({
  name: 'graph/graphLoad',
  initialState,
  reducers: {
    initializeWorkflowLoadState(state, action: PayloadAction<{ workflowId: WorkflowId }>) {
      const { workflowId } = action.payload
      state.byWorkflowId[workflowId] ??= makeInitialResourceState()
    },
    setResourceStatus(
      state,
      action: PayloadAction<{
        workflowId: WorkflowId
        resource: keyof GraphResourceLoadState
        status: GraphLoadStatus
      }>
    ) {
      const { workflowId, resource, status } = action.payload
      state.byWorkflowId[workflowId] ??= makeInitialResourceState()
      state.byWorkflowId[workflowId][resource] = status
    },
    clearWorkflowLoadState(state, action: PayloadAction<{ workflowId: WorkflowId }>) {
      delete state.byWorkflowId[action.payload.workflowId]
    },
    clearAllLoadState(state) {
      state.byWorkflowId = {}
    }
  }
})

export const graphLoadReducer = graphLoadSlice.reducer
export const graphLoadActions = graphLoadSlice.actions
export type { GraphLoadState }
