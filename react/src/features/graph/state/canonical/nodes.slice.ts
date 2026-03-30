import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { NodeEntity, WorkflowId } from '../model/types'

export const nodesAdapter = createEntityAdapter<NodeEntity>()

export type NodesState = ReturnType<typeof nodesAdapter.getInitialState>

const initialState: NodesState = nodesAdapter.getInitialState()

const nodesSlice = createSlice({
  name: 'graph/canonical/nodes',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<NodeEntity[]>) {
      nodesAdapter.upsertMany(state, action.payload)
    },
    removeManyById(state, action: PayloadAction<string[]>) {
      nodesAdapter.removeMany(state, action.payload)
    },
    removeByWorkflowId(state, action: PayloadAction<WorkflowId>) {
      const ids = state.ids.filter((id) => {
        const node = state.entities[id]
        return node?.workflowId === action.payload
      })
      nodesAdapter.removeMany(state, ids)
    },
    clearAll(state) {
      nodesAdapter.removeAll(state)
    }
  }
})

export const nodesReducer = nodesSlice.reducer
export const nodesActions = nodesSlice.actions
