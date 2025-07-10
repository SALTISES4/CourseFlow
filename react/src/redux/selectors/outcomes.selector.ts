import { findIndexPath } from '@cfRedux/slices/outcomes.slice'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectOutcomes = (state: AppState) => state.outcomes.groups

export const selectOutcomeById = createSelector(
  [selectOutcomes, (_: AppState, id: number) => id],
  (outcomes, id) => {
    const pathToOutcome = findIndexPath(id, outcomes)
    if (pathToOutcome.length) {
      let current = outcomes
      for (let i = 0; i < pathToOutcome.length - 1; i++) {
        const index = pathToOutcome[i]
        current = current?.[index].children
      }
      const lastIndex = pathToOutcome[pathToOutcome.length - 1]
      if (current && current[lastIndex]) {
        return current[lastIndex]
      }
    }

    return null
  }
)
