import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

const selectOutcomeData = (state: RootState) => state.outcomes.outcomeData
const selectOutcomeOrder = (state: RootState) => state.outcomes.outcomeOrder

export const selectOutcomes = createSelector(
  [selectOutcomeOrder, selectOutcomeData],
  (outcomeOrder, outcomesData) => outcomeOrder.map((id) => outcomesData[id])
)

export const selectOutcomeGroups = createSelector(
  [selectOutcomeOrder, selectOutcomeData],
  (outcomeOrder, outcomesData) => {
    return outcomeOrder
      .map((id) => outcomesData[id])
      .filter((outcome) => outcome?.parent === null)
  }
)

export const selectOutcomeChildrenById = createSelector(
  [
    selectOutcomeOrder,
    selectOutcomeData,
    (_: RootState, parentId: number | null) => parentId
  ],
  (outcomeOrder, outcomesData, parentId) => {
    if (parentId === null) {
      return outcomeOrder
        .map((id) => outcomesData[id])
        .filter((outcome) => outcome?.parent === null)
    }

    return outcomesData[parentId].children.map((c) => outcomesData[c])
  }
)

// drill through the outcome data to derive prefix based on parent outcomes
export const getPrefixPath = createSelector(
  [selectOutcomeData, (_: RootState, id: number) => id],
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
