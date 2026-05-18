import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { WorkflowEntity, WorkflowUuid } from '../../model/types'

export const workflowAdapter = createEntityAdapter<
  WorkflowEntity,
  WorkflowUuid
>({
  selectId: (w) => w.uuid
})

export type WorkflowState = ReturnType<typeof workflowAdapter.getInitialState>

const initialState: WorkflowState = workflowAdapter.getInitialState()

const workflowSlice = createSlice({
  name: 'graph/canonical/workflow',
  initialState,
  reducers: {
    upsertOne(state, action: PayloadAction<WorkflowEntity>) {
      workflowAdapter.upsertOne(state, action.payload)
    },
    upsertMany(state, action: PayloadAction<WorkflowEntity[]>) {
      workflowAdapter.upsertMany(state, action.payload)
    },
    removeByUuid(state, action: PayloadAction<WorkflowUuid>) {
      workflowAdapter.removeOne(state, action.payload)
    },
    clearAll(state) {
      workflowAdapter.removeAll(state)
    }
  }
})

export const workflowReducer = workflowSlice.reducer
export const workflowActions = workflowSlice.actions
