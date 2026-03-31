import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { NodeEntity, ResourceUuid, WorkflowUuid } from '../model/types'

export const nodesAdapter = createEntityAdapter<NodeEntity, ResourceUuid>({
  selectId: (n) => n.uuid
})

export type NodesState = ReturnType<typeof nodesAdapter.getInitialState>

const initialState: NodesState = nodesAdapter.getInitialState()

const nodesSlice = createSlice({
  name: 'graph/canonical/nodes',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<NodeEntity[]>) {
      nodesAdapter.upsertMany(state, action.payload)
    },
    removeManyByUuid(state, action: PayloadAction<string[]>) {
      nodesAdapter.removeMany(state, action.payload)
    },
    removeByWorkflowUuid(state, action: PayloadAction<WorkflowUuid>) {
      const ids = state.ids.filter((id) => {
        const node = state.entities[id]
        return node?.workflowUuid === action.payload
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
