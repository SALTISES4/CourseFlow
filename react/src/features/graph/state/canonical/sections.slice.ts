import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { GraphUuid, ResourceUuid, SectionEntity } from '../model/types'

export const sectionsAdapter = createEntityAdapter<SectionEntity, ResourceUuid>(
  {
    selectId: (s) => s.uuid
  }
)

export type SectionsState = ReturnType<typeof sectionsAdapter.getInitialState>

const initialState: SectionsState = sectionsAdapter.getInitialState()

const sectionsSlice = createSlice({
  name: 'graph/canonical/sections',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<SectionEntity[]>) {
      sectionsAdapter.upsertMany(state, action.payload)
    },
    removeByGraphUuid(state, action: PayloadAction<GraphUuid>) {
      const ids = state.ids.filter((id) => {
        const section = state.entities[id]
        return section?.graphUuid === action.payload
      })
      sectionsAdapter.removeMany(state, ids)
    },
    clearAll(state) {
      sectionsAdapter.removeAll(state)
    }
  }
})

export const sectionsReducer = sectionsSlice.reducer
export const sectionsActions = sectionsSlice.actions
