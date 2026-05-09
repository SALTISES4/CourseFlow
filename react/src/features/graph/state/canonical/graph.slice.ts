import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { GraphEntity, GraphUuid } from '../model/types'

export const graphAdapter = createEntityAdapter<GraphEntity, GraphUuid>({
  selectId: (g) => g.uuid
})

export type GraphCanonicalState = ReturnType<typeof graphAdapter.getInitialState>

const initialState: GraphCanonicalState = graphAdapter.getInitialState()

const graphSlice = createSlice({
  name: 'graph/canonical/graph',
  initialState,
  reducers: {
    upsertOne(state, action: PayloadAction<GraphEntity>) {
      graphAdapter.upsertOne(state, action.payload)
    },
    upsertMany(state, action: PayloadAction<GraphEntity[]>) {
      graphAdapter.upsertMany(state, action.payload)
    },
    removeByUuid(state, action: PayloadAction<GraphUuid>) {
      graphAdapter.removeOne(state, action.payload)
    },
    updateRevision(
      state,
      action: PayloadAction<{ graphUuid: GraphUuid; revisionId: number }>
    ) {
      const { graphUuid, revisionId } = action.payload
      graphAdapter.updateOne(state, {
        id: graphUuid,
        changes: { revisionId }
      })
    },
    clearAll(state) {
      graphAdapter.removeAll(state)
    }
  }
})

export const graphReducer = graphSlice.reducer
export const graphActions = graphSlice.actions
