import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { ChannelEntity, GraphUuid, ResourceUuid } from '../model/types'

export const channelsAdapter = createEntityAdapter<ChannelEntity, ResourceUuid>(
  {
    selectId: (c) => c.uuid
  }
)

export type ChannelsState = ReturnType<typeof channelsAdapter.getInitialState>

const initialState: ChannelsState = channelsAdapter.getInitialState()

const channelsSlice = createSlice({
  name: 'graph/canonical/channels',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<ChannelEntity[]>) {
      channelsAdapter.upsertMany(state, action.payload)
    },
    removeByGraphUuid(state, action: PayloadAction<GraphUuid>) {
      const ids = state.ids.filter((id) => {
        const channel = state.entities[id]
        return channel?.graphUuid === action.payload
      })
      channelsAdapter.removeMany(state, ids)
    },
    clearAll(state) {
      channelsAdapter.removeAll(state)
    }
  }
})

export const channelsReducer = channelsSlice.reducer
export const channelsActions = channelsSlice.actions
