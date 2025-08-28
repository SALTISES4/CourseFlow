import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectOutcomeData = (state: AppState) => state.outcomes.outcomeData
const selectOutcomeOrder = (state: AppState) => state.outcomes.outcomeOrder

export const selectOutcomeGroups = createSelector(
  [selectOutcomeOrder, selectOutcomeData],
  (outcomeOrder, outcomesData) => {
    return outcomeOrder
      .map((id) => outcomesData[id])
      .filter((outcome) => outcome?.parent === null)
  }
)

export const selectOutcomeChildrenById = createSelector(
  [selectOutcomeData, (_: AppState, parentId: number) => parentId],
  (outcomesData, parentId) => {
    return outcomesData[parentId].children.map((c) => outcomesData[c])
  }
)

// drill through the outcome data to derive prefix based on parent outcomes
export const getPrefixPath = createSelector(
  [selectOutcomeData, (_: AppState, id: number) => id],
  (outcomesData, outcomeId) => {
    const path: (number | string)[] = []
    let outcome = outcomesData[outcomeId]

    while (outcome && outcome.parent) {
      const index = outcomesData[outcome.parent].children.indexOf(outcome.id)

      if (outcome.level === 1 && outcome.code) {
        // use the 'code' prefix, which is only supported at level 1 outcomes
        path.unshift(outcome.code)
      } else {
        // otherwise use the regular found index
        path.unshift(index + 1)
      }

      outcome = outcomesData[outcome.parent]
    }

    // make it so that root string prefixes are separated by the dash
    // otherwise, it's all numbered
    const prefix =
      path.length === 1 && typeof path[0] === 'string'
        ? path + ' - '
        : path.join('.') + '.'

    return prefix
  }
)
