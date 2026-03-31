import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type {
  GraphLoadStatus,
  GraphResourceLoadState,
  WorkflowUuid
} from './model/types'

type GraphLoadState = {
  byWorkflowUuid: Record<WorkflowUuid, GraphResourceLoadState>
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
  byWorkflowUuid: {}
}

const graphLoadSlice = createSlice({
  name: 'graph/graphLoad',
  initialState,
  reducers: {
    initializeWorkflowLoadState(
      state,
      action: PayloadAction<{ workflowUuid: WorkflowUuid }>
    ) {
      const { workflowUuid } = action.payload
      state.byWorkflowUuid[workflowUuid] ??= makeInitialResourceState()
    },
    setResourceStatus(
      state,
      action: PayloadAction<{
        workflowUuid: WorkflowUuid
        resource: keyof GraphResourceLoadState
        status: GraphLoadStatus
      }>
    ) {
      const { workflowUuid, resource, status } = action.payload
      state.byWorkflowUuid[workflowUuid] ??= makeInitialResourceState()
      state.byWorkflowUuid[workflowUuid][resource] = status
    },
    clearWorkflowLoadState(
      state,
      action: PayloadAction<{ workflowUuid: WorkflowUuid }>
    ) {
      delete state.byWorkflowUuid[action.payload.workflowUuid]
    },
    clearAllLoadState(state) {
      state.byWorkflowUuid = {}
    }
  }
})

export const graphLoadReducer = graphLoadSlice.reducer
export const graphLoadActions = graphLoadSlice.actions
export type { GraphLoadState }
