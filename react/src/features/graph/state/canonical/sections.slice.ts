import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { SectionEntity, WorkflowId } from '../model/types'

export const sectionsAdapter = createEntityAdapter<SectionEntity>()

export type SectionsState = ReturnType<typeof sectionsAdapter.getInitialState>

const initialState: SectionsState = sectionsAdapter.getInitialState()

const sectionsSlice = createSlice({
  name: 'graph/canonical/sections',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<SectionEntity[]>) {
      sectionsAdapter.upsertMany(state, action.payload)
    },
    removeByWorkflowId(state, action: PayloadAction<WorkflowId>) {
      const ids = state.ids.filter((id) => {
        const section = state.entities[id]
        return section?.workflowId === action.payload
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
