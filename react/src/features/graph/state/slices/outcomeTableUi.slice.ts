import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { ResourceUuid } from '../model/types'

type OutcomeTableUiState = {
  viewType: 'normal' | 'matrix'
  expandedOutcomes: Record<ResourceUuid, boolean>
}

const initialState: OutcomeTableUiState = {
  viewType: 'normal',
  expandedOutcomes: {}
}

const outcomeTableUiSlice = createSlice({
  name: 'graph/outcomeTableUi',
  initialState,
  reducers: {
    outcomeExpand(state, action: PayloadAction<{ uuid: ResourceUuid }>) {
      const { uuid } = action.payload
      const newVal = state.expandedOutcomes[uuid] ?? false
      state.expandedOutcomes[uuid] = !newVal
    },
    viewTypeChange(
      state,
      action: PayloadAction<{ viewType: OutcomeTableUiState['viewType'] }>
    ) {
      const { viewType } = action.payload
      state.viewType = viewType
    }
  }
})

export const outcomeTableUiReducer = outcomeTableUiSlice.reducer
export const outcomeTableUiActions = outcomeTableUiSlice.actions
