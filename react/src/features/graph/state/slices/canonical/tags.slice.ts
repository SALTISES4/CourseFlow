import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { TagEntity } from '../../model/types'

export const tagsAdapter = createEntityAdapter<TagEntity, string>({
  selectId: (t) => t.tagId
})

export type TagsState = ReturnType<typeof tagsAdapter.getInitialState>

const initialState: TagsState = tagsAdapter.getInitialState()

const tagsSlice = createSlice({
  name: 'graph/canonical/tags',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<TagEntity[]>) {
      tagsAdapter.upsertMany(state, action.payload)
    },
    removeManyByTagId(state, action: PayloadAction<string[]>) {
      tagsAdapter.removeMany(state, action.payload)
    },
    clearAll(state) {
      tagsAdapter.removeAll(state)
    }
  }
})

export const tagsReducer = tagsSlice.reducer
export const tagsActions = tagsSlice.actions
