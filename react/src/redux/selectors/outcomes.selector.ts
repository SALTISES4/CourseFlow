import { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

const selectOutcomeData = (state: RootState) => state.outcomes.outcomeData
const selectOutcomeOrder = (state: RootState) => state.outcomes.outcomeOrder

export const selectOutcomes = createSelector(
  [selectOutcomeOrder, selectOutcomeData],
  (outcomeOrder, outcomesData) => outcomeOrder.map((id) => outcomesData[id])
)

type TagGroup = {
  id: number
  title: string
  outcomes: number[]
}

// generate groups of outcomes, grouped by untagged/tagged-by-id
export const selectOutcomeTagGroups = createSelector(
  [selectOutcomeOrder, selectOutcomeData],
  (outcomeOrder, outcomeData) => {
    const tagGroups: TagGroup[] = [
      { id: -1, title: _t('Untagged'), outcomes: [] }
    ]

    for (let i = 0; i < outcomeOrder.length; i++) {
      const outcome = outcomeData[outcomeOrder[i]]
      if (!outcome.tags?.length) {
        tagGroups[0].outcomes.push(outcome.id)
      }

      for (let j = 0; j < outcome.tags.length; j++) {
        const tagId = outcome.tags[j]
        const foundIndex = tagGroups.findIndex((t) => t.id === tagId)
        if (foundIndex === -1) {
          tagGroups.push({
            id: tagId,
            title: `Tag group - #${tagId}`,
            outcomes: [outcome.id]
          })
        } else {
          tagGroups[foundIndex].outcomes.push(outcome.id)
        }
      }
    }

    return tagGroups.sort((a, b) => a.id - b.id)
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
