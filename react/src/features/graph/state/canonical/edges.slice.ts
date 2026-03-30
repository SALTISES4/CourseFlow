import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { EdgeEntity, WorkflowId } from '../model/types'

export const edgesAdapter = createEntityAdapter<EdgeEntity>()

export type EdgesState = ReturnType<typeof edgesAdapter.getInitialState>

const initialState: EdgesState = edgesAdapter.getInitialState()

const edgesSlice = createSlice({
  name: 'graph/canonical/edges',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<EdgeEntity[]>) {
      edgesAdapter.upsertMany(state, action.payload)
    },
    removeManyById(state, action: PayloadAction<string[]>) {
      edgesAdapter.removeMany(state, action.payload)
    },
    removeByWorkflowId(state, action: PayloadAction<WorkflowId>) {
      const ids = state.ids.filter((id) => {
        const edge = state.entities[id]
        return edge?.workflowId === action.payload
      })
      edgesAdapter.removeMany(state, ids)
    },
    clearAll(state) {
      edgesAdapter.removeAll(state)
    }
  }
})

export const edgesReducer = edgesSlice.reducer
export const edgesActions = edgesSlice.actions
