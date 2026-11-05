import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { ResourceUuid } from '../model/types'

export type ExpandMode = 'default' | 'expandAll' | 'collapseAll'

export type OutcomeTableUiState = {
  viewType: 'normal' | 'matrix'
  sortType: 'time' | 'category' | 'context' | null // defaults to time
  expandMode: ExpandMode
  expandedOverrides: Record<ResourceUuid, true>
}

const initialState: OutcomeTableUiState = {
  viewType: 'normal',
  sortType: null,
  expandMode: 'default',
  expandedOverrides: {}
}

const outcomeTableUiSlice = createSlice({
  name: 'graph/outcomeTableUi',
  initialState,
  reducers: {
    outcomeExpand(state, action: PayloadAction<{ uuid: ResourceUuid }>) {
      const { uuid } = action.payload
      if (state.expandedOverrides[uuid]) {
        delete state.expandedOverrides[uuid]
      } else {
        state.expandedOverrides[uuid] = true
      }
    },
    outcomeForceMode(state, action: PayloadAction<{ mode: ExpandMode }>) {
      state.expandedOverrides = {} // make it so expand mode applies to everything
      state.expandMode = action.payload.mode
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
