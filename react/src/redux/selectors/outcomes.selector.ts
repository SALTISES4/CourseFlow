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
