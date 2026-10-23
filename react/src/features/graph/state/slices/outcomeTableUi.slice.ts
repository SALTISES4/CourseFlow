import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { ResourceUuid } from '../model/types'

type OutcomeTableUiState = {
  viewType: 'normal' | 'matrix'
  sortType: 'time' | 'category' | 'context' | null // defaults to time
  expandedOutcomes: Record<ResourceUuid, boolean>
}

const initialState: OutcomeTableUiState = {
  viewType: 'normal',
  sortType: null,
  expandedOutcomes: {}
}

const outcomeTableUiSlice = createSlice({
  name: 'graph/outcomeTableUi',
  initialState,
  reducers: {
    outcomeExpand(state, action: PayloadAction<{ uuid: ResourceUuid }>) {
      const { uuid } = action.payload
      const expanded = state.expandedOutcomes[uuid] ?? false

      if (!expanded) {
        state.expandedOutcomes[uuid] = !expanded
      } else {
        delete state.expandedOutcomes[uuid]
      }
    },
    viewTypeChange(
      state,
      action: PayloadAction<{ viewType: OutcomeTableUiState['viewType'] }>
    ) {
      state.viewType = action.payload.viewType
    },
    sortTypeChange(
      state,
      action: PayloadAction<{ sort: OutcomeTableUiState['sortType'] }>
    ) {
      const { sort } = action.payload
      const newSort = sort ?? 'time'

      if (state.sortType !== sort) {
        state.sortType = newSort
      }
    }
  }
})

export const outcomeTableUiReducer = outcomeTableUiSlice.reducer
export const outcomeTableUiActions = outcomeTableUiSlice.actions
