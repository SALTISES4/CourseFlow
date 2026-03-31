import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { WorkflowMetaEntity, WorkflowUuid } from '../model/types'

export const workflowMetaAdapter = createEntityAdapter<
  WorkflowMetaEntity,
  WorkflowUuid
>({
  selectId: (w) => w.uuid
})

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
    removeByUuid(state, action: PayloadAction<WorkflowUuid>) {
      workflowMetaAdapter.removeOne(state, action.payload)
    },
    updateRevision(
      state,
      action: PayloadAction<{ workflowUuid: WorkflowUuid; revisionId: number }>
    ) {
      const { workflowUuid, revisionId } = action.payload
      workflowMetaAdapter.updateOne(state, {
        id: workflowUuid,
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
