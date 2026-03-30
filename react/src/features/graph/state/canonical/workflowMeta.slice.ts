import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { WorkflowId, WorkflowMetaEntity } from '../model/types'

export const workflowMetaAdapter = createEntityAdapter<WorkflowMetaEntity>()

export type WorkflowMetaState = ReturnType<
  typeof workflowMetaAdapter.getInitialState
>

const initialState: WorkflowMetaState = workflowMetaAdapter.getInitialState()

const workflowMetaSlice = createSlice({
  name: 'graph/canonical/workflowMeta',
  initialState,
  reducers: {
    upsertOne(state, action: PayloadAction<WorkflowMetaEntity>) {
      workflowMetaAdapter.upsertOne(state, action.payload)
    },
    upsertMany(state, action: PayloadAction<WorkflowMetaEntity[]>) {
      workflowMetaAdapter.upsertMany(state, action.payload)
    },
    removeById(state, action: PayloadAction<WorkflowId>) {
      workflowMetaAdapter.removeOne(state, action.payload)
    },
    updateRevision(
      state,
      action: PayloadAction<{ workflowId: WorkflowId; revisionId: number }>
    ) {
      const { workflowId, revisionId } = action.payload
      workflowMetaAdapter.updateOne(state, {
        id: workflowId,
        changes: { revisionId }
      })
    },
    clearAll(state) {
      workflowMetaAdapter.removeAll(state)
    }
  }
})

export const workflowMetaReducer = workflowMetaSlice.reducer
export const workflowMetaActions = workflowMetaSlice.actions
