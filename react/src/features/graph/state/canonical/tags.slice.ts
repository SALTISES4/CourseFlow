import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { TagEntity } from '../model/types'

export const tagsAdapter = createEntityAdapter<TagEntity>()

export type TagsState = ReturnType<typeof tagsAdapter.getInitialState>

const initialState: TagsState = tagsAdapter.getInitialState()

const tagsSlice = createSlice({
  name: 'graph/canonical/tags',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<TagEntity[]>) {
      tagsAdapter.upsertMany(state, action.payload)
    },
    removeManyById(state, action: PayloadAction<string[]>) {
      tagsAdapter.removeMany(state, action.payload)
    },
    clearAll(state) {
      tagsAdapter.removeAll(state)
    }
  }
})

export const tagsReducer = tagsSlice.reducer
export const tagsActions = tagsSlice.actions
