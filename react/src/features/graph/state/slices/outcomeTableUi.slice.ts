import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { ResourceUuid } from '../model/types'

export type OutcomeTableSortMode = 'chronological' | 'nodeCategory' | 'context'

export type OutcomeTableViewType = 'normal' | 'matrix'

type OutcomeTableUiState = {
  viewType: OutcomeTableViewType
  sortMode: OutcomeTableSortMode
  expandedOutcomes: Record<ResourceUuid, boolean>
}

const initialState: OutcomeTableUiState = {
  viewType: 'normal',
  sortMode: 'chronological',
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
    },
    sortModeChange(
      state,
      action: PayloadAction<{ sortMode: OutcomeTableSortMode }>
    ) {
      state.sortMode = action.payload.sortMode
    },
    setExpandedOutcomes(
      state,
      action: PayloadAction<{ uuids: ResourceUuid[]; expanded: boolean }>
    ) {
      state.expandedOutcomes = action.payload.expanded
        ? Object.fromEntries(action.payload.uuids.map((uuid) => [uuid, true]))
        : {}
    },
    resetOutcomeTableUi() {
      return { ...initialState, expandedOutcomes: {} }
    }
  }
})

export const outcomeTableUiReducer = outcomeTableUiSlice.reducer
export const outcomeTableUiActions = outcomeTableUiSlice.actions
