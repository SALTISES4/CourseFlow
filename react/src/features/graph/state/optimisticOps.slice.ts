import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { GraphUuid, PendingGraphOperation } from './model/types'

export const optimisticOpsAdapter = createEntityAdapter<
  PendingGraphOperation,
  string
>({
  selectId: (op) => op.uuid
})

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
        uuid: PendingGraphOperation['uuid']
        status: PendingGraphOperation['status']
      }>
    ) {
      optimisticOpsAdapter.updateOne(state, {
        id: action.payload.uuid,
        changes: { status: action.payload.status }
      })
    },
    removeById(state, action: PayloadAction<PendingGraphOperation['uuid']>) {
      optimisticOpsAdapter.removeOne(state, action.payload)
    },
    removeByGraphUuid(state, action: PayloadAction<GraphUuid>) {
      const ids = state.ids.filter((id) => {
        const op = state.entities[id]
        return op?.graphUuid === action.payload
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
