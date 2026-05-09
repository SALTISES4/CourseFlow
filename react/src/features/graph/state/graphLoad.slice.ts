import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type {
  GraphUuid,
  GraphLoadStatus,
  GraphResourceLoadState
} from './model/types'

type GraphLoadState = {
  byGraphUuid: Record<GraphUuid, GraphResourceLoadState>
}

const makeInitialResourceState = (): GraphResourceLoadState => ({
  graph: 'idle',
  sections: 'idle',
  channels: 'idle',
  nodes: 'idle',
  edges: 'idle',
  tags: 'idle'
})

const initialState: GraphLoadState = {
  byGraphUuid: {}
}

const graphLoadSlice = createSlice({
  name: 'graph/graphLoad',
  initialState,
  reducers: {
    initializeGraphLoadState(
      state,
      action: PayloadAction<{ graphUuid: GraphUuid }>
    ) {
      const { graphUuid } = action.payload
      state.byGraphUuid[graphUuid] ??= makeInitialResourceState()
    },
    setResourceStatus(
      state,
      action: PayloadAction<{
        graphUuid: GraphUuid
        resource: keyof GraphResourceLoadState
        status: GraphLoadStatus
      }>
    ) {
      const { graphUuid, resource, status } = action.payload
      state.byGraphUuid[graphUuid] ??= makeInitialResourceState()
      state.byGraphUuid[graphUuid][resource] = status
    },
    clearGraphLoadState(
      state,
      action: PayloadAction<{ graphUuid: GraphUuid }>
    ) {
      delete state.byGraphUuid[action.payload.graphUuid]
    },
    clearAllLoadState(state) {
      state.byGraphUuid = {}
    }
  }
})

export const graphLoadReducer = graphLoadSlice.reducer
export const graphLoadActions = graphLoadSlice.actions
export type { GraphLoadState }
