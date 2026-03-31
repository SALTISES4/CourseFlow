import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { ResourceUuid, SectionEntity, WorkflowUuid } from '../model/types'

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
    removeByWorkflowUuid(state, action: PayloadAction<WorkflowUuid>) {
      const ids = state.ids.filter((id) => {
        const section = state.entities[id]
        return section?.workflowUuid === action.payload
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
