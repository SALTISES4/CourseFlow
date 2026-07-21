import {
  type PayloadAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import type { GraphUuid, OutcomeEntity, ResourceUuid } from '../../model/types'

export const outcomesAdapter = createEntityAdapter<OutcomeEntity, ResourceUuid>(
  {
    selectId: (o) => o.uuid
  }
)

export type OutcomesState = ReturnType<typeof outcomesAdapter.getInitialState>

const initialState: OutcomesState = outcomesAdapter.getInitialState()

const outcomesSlice = createSlice({
  name: 'graph/canonical/outcomes',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<OutcomeEntity[]>) {
      outcomesAdapter.upsertMany(state, action.payload)
    },
    removeManyByUuid(state, action: PayloadAction<string[]>) {
      outcomesAdapter.removeMany(state, action.payload)
    },
    removeByGraphUuid(state, action: PayloadAction<GraphUuid>) {
      const ids = state.ids.filter((id) => {
        const outcome = state.entities[id]
        return outcome?.graphUuid === action.payload
      })
      outcomesAdapter.removeMany(state, ids)
    },
    clearAll(state) {
      outcomesAdapter.removeAll(state)
    }
  }
})

export const outcomesReducer = outcomesSlice.reducer
export const outcomesActions = outcomesSlice.actions
