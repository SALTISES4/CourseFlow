import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { ResourceUuid, ThreadCommentCount } from '../model/types'

export type ThreadCommentCountsState = Record<ResourceUuid, number>

const initialState: ThreadCommentCountsState = {}

const threadCommentCountsSlice = createSlice({
  name: 'graph/threadCommentCounts',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<ThreadCommentCount[]>) {
      action.payload.forEach(({ threadUuid, commentCount }) => {
        state[threadUuid] = commentCount
      })
    },
    adjustCount(
      state,
      action: PayloadAction<{ threadUuid: ResourceUuid; delta: number }>
    ) {
      const { threadUuid, delta } = action.payload
      state[threadUuid] = Math.max(0, (state[threadUuid] ?? 0) + delta)
    },
    clearAll() {
      return initialState
    }
  }
})

export const threadCommentCountsReducer = threadCommentCountsSlice.reducer
export const threadCommentCountsActions = threadCommentCountsSlice.actions
