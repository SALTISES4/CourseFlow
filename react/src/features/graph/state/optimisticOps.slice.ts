import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { PendingGraphOperation, WorkflowId } from './model/types'

export const optimisticOpsAdapter = createEntityAdapter<PendingGraphOperation>()

export type OptimisticOpsState = ReturnType<
  typeof optimisticOpsAdapter.getInitialState
>

const initialState: OptimisticOpsState = optimisticOpsAdapter.getInitialState()

const optimisticOpsSlice = createSlice({
  name: 'graph/optimisticOps',
  initialState,
  reducers: {
    enqueue(state, action: PayloadAction<PendingGraphOperation>) {
      optimisticOpsAdapter.addOne(state, action.payload)
    },
    updateStatus(
      state,
      action: PayloadAction<{
        id: PendingGraphOperation['id']
        status: PendingGraphOperation['status']
      }>
    ) {
      optimisticOpsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: { status: action.payload.status }
      })
    },
    removeById(state, action: PayloadAction<PendingGraphOperation['id']>) {
      optimisticOpsAdapter.removeOne(state, action.payload)
    },
    removeByWorkflowId(state, action: PayloadAction<WorkflowId>) {
      const ids = state.ids.filter((id) => {
        const op = state.entities[id]
        return op?.workflowId === action.payload
      })
      optimisticOpsAdapter.removeMany(state, ids)
    },
    clearAll(state) {
      optimisticOpsAdapter.removeAll(state)
    }
  }
})

export const optimisticOpsReducer = optimisticOpsSlice.reducer
export const optimisticOpsActions = optimisticOpsSlice.actions
