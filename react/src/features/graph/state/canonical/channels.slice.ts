import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { ChannelEntity, WorkflowId } from '../model/types'

export const channelsAdapter = createEntityAdapter<ChannelEntity>()

export type ChannelsState = ReturnType<typeof channelsAdapter.getInitialState>

const initialState: ChannelsState = channelsAdapter.getInitialState()

const channelsSlice = createSlice({
  name: 'graph/canonical/channels',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<ChannelEntity[]>) {
      channelsAdapter.upsertMany(state, action.payload)
    },
    removeByWorkflowId(state, action: PayloadAction<WorkflowId>) {
      const ids = state.ids.filter((id) => {
        const channel = state.entities[id]
        return channel?.workflowId === action.payload
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
