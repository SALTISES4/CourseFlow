import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import type { ResourceUuid } from '../model/types'

export type OutcomeUiState = {
  dragging: { uuid: ResourceUuid; level: number } | null
  highlightedOutcomeUuids: ResourceUuid[]
  expandedOutcomeUuids: ResourceUuid[]
}

const initialState: OutcomeUiState = {
  dragging: null,
  highlightedOutcomeUuids: [],
  expandedOutcomeUuids: []
}

const outcomeUiSlice = createSlice({
  name: 'graph/outcomeUi',
  initialState,
  reducers: {
    setDragging(
      state,
      action: PayloadAction<{ uuid: ResourceUuid; level: number } | null>
    ) {
      state.dragging = action.payload
    },
    toggleHighlighted(state, action: PayloadAction<ResourceUuid>) {
      const uuid = action.payload
      const index = state.highlightedOutcomeUuids.indexOf(uuid)
      if (index === -1) {
        state.highlightedOutcomeUuids.push(uuid)
      } else {
        state.highlightedOutcomeUuids.splice(index, 1)
      }
    },
    setOutcomeExpanded(
      state,
      action: PayloadAction<{ uuid: ResourceUuid; expanded: boolean }>
    ) {
      const { uuid, expanded } = action.payload
      state.expandedOutcomeUuids = expanded
        ? Array.from(new Set([...state.expandedOutcomeUuids, uuid]))
        : state.expandedOutcomeUuids.filter((id) => id !== uuid)
    },
    setExpandedOutcomeUuids(state, action: PayloadAction<ResourceUuid[]>) {
      state.expandedOutcomeUuids = Array.from(new Set(action.payload))
    },
    clearOutcomeUi() {
      return initialState
    }
  }
})

export const outcomeUiReducer = outcomeUiSlice.reducer
export const outcomeUiActions = outcomeUiSlice.actions
