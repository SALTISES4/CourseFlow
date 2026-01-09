import { _t } from '@cf/utility/Utility.class'
import { outcomeAdapter } from '@cfRedux/slices/outcomes.slice'
import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

export const {
  selectAll: selectAllOutcomes,
  selectById: selectOutcomeById,
  selectIds: selectOutcomeIds
} = outcomeAdapter.getSelectors<RootState>((state) => state.outcomes)

const selectEntities = (state: RootState) => state.outcomes.entities
const selectOrder = (state: RootState) => state.outcomes.order

type TagGroup = {
  id: number
  title: string
  outcomes: number[]
}

// generate groups of outcomes, grouped by untagged/tagged-by-id
export const selectOutcomeTagGroups = createSelector(
  [selectOrder, selectEntities],
  (order, entities) => {
    const tagGroups: TagGroup[] = [
      { id: -1, title: _t('Untagged'), outcomes: [] }
    ]

    for (let i = 0; i < order.length; i++) {
      const outcome = entities[order[i]]
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
    selectOrder,
    selectEntities,
    (_: RootState, parentId: number | null) => parentId
  ],
  (order, entities, parentId) => {
    if (parentId === null) {
      return order
        .map((id) => entities[id])
        .filter((outcome) => outcome?.parent === null)
    }

    return entities[parentId].children.map((c) => entities[c])
  }
)

// drill through the outcome data to derive prefix based on parent outcomes
export const getPrefixPath = createSelector(
  [selectEntities, (_: RootState, id: number) => id],
  (entities, outcomeId) => {
    const path: (number | string)[] = []
    let outcome = entities[outcomeId]

    // TODO: take a look at how prefixing/ordering will be handled
    // ie, whether it's attached to each separate outcome or what
    // (so that it can be rendered outside of the tree regardless of its "index" position)

    while (outcome && outcome.parent) {
      const index = entities[outcome.parent].children.indexOf(outcome.id)

      if (outcome.level === 0 && outcome.code) {
        // use the 'code' prefix, which is only supported at level 1 outcomes
        path.unshift(outcome.code)
      } else {
        // otherwise use the regular found index
        path.unshift(index + 1)
      }

      outcome = entities[outcome.parent]
    }

    // make it so that root string prefixes are separated by the dash
    // otherwise, it's all numbered
    const prefix =
      path.length === 1 && typeof path[0] === 'string'
        ? path + ' - '
        : path.join('.') + '. '

    return prefix
  }
)
