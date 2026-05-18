import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { EdgeEntity, EdgeKey, GraphUuid } from '../../model/types'

export const edgesAdapter = createEntityAdapter<EdgeEntity, EdgeKey>({
  selectId: (e) => e.edgeId
})

export type EdgesState = ReturnType<typeof edgesAdapter.getInitialState>

const initialState: EdgesState = edgesAdapter.getInitialState()

const edgesSlice = createSlice({
  name: 'graph/canonical/edges',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<EdgeEntity[]>) {
      edgesAdapter.upsertMany(state, action.payload)
    },
    removeManyByEdgeId(state, action: PayloadAction<EdgeKey[]>) {
      edgesAdapter.removeMany(state, action.payload)
    },
    removeByGraphUuid(state, action: PayloadAction<GraphUuid>) {
      const ids = state.ids.filter((id) => {
        const edge = state.entities[id]
        return edge?.graphUuid === action.payload
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
