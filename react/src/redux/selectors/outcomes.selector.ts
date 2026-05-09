import { _t } from '@cf/utility/Utility.class'
import { outcomeAdapter } from '@cfRedux/slices/outcomes.slice'
import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

import editTabNodeData from '../../components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/optionsData'

export const {
  selectAll: selectAllOutcomes,
  selectById: selectOutcomeById,
  selectIds: selectOutcomeIds,
  selectEntities: selectOutcomeEntities
} = outcomeAdapter.getSelectors<RootState>((state) => state.outcomes)

export const selectRootOutcomeIds = createSelector(
  [selectOutcomeIds, selectOutcomeEntities],
  (ids, entities) => {
    const found: number[] = []
    ids.forEach((id) => {
      if (entities[id].parent === null) {
        found.push(id)
      }
    })
    return found
  }
)

export const selectRootOutcomes = createSelector(
  [selectAllOutcomes],
  (outcomes) => outcomes.filter((o) => o.parent === null)
)

export const selectHighlightedOutcomes = createSelector(
  (state: RootState) => [], // state.outcomes,
  (outcomes) => [] // outcomes.highlighted
)

export const isHighlightedViaOutcome = createSelector(
  [selectHighlightedOutcomes, (_: RootState, searchIds: number[]) => searchIds],
  (haystack, needle) => needle.some((n) => haystack.includes(n))
)

// TODO: this actually needs to live somewhere else
const tagsData = editTabNodeData.tags

type TagGroup = {
  uuid: string
  title: string
  outcomes: number[]
}

// generate groups of outcomes, grouped by untagged/tagged-by-id
export const selectOutcomeTagGroups = createSelector(
  [selectRootOutcomes],
  (rootOuutcomes) => {
    const tagGroups: TagGroup[] = []
    const untagged: TagGroup = {
      uuid: -1,
      title: _t('Untagged'),
      outcomes: []
    }

    for (let i = 0; i < rootOuutcomes.length; i++) {
      const outcome = rootOuutcomes[i]

      // if no tags, throw into the untagged group
      if (!outcome.tags || outcome.tags.length === 0) {
        untagged.outcomes.push(outcome.uuid)
        continue
      }

      // otherwise, loop through tags and throw into respective groups
      for (let j = 0; j < outcome.tags.length; j++) {
        const tagId = outcome.tags[j]
        const foundIndex = tagGroups.findIndex((t) => t.uuid === tagId)
        if (foundIndex === -1) {
          tagGroups.push({
            uuid: tagId,
            title: tagsData.find((t) => t.uuid === tagId).label,
            outcomes: [outcome.uuid]
          })
        } else {
          tagGroups[foundIndex].outcomes.push(outcome.uuid)
        }
      }
    }

    if (untagged.outcomes.length) {
      tagGroups.push(untagged)
    }

    return tagGroups.sort((a, b) => a.uuid - b.uuid)
  }
)

export const selectOutcomeChildrenById = createSelector(
  [
    selectAllOutcomes,
    selectOutcomeEntities,
    (_: RootState, parentuuid: string | null) => parentId
  ],
  (allOutcomes, entities, parentId) => {
    if (parentId === null) {
      return allOutcomes.filter((o) => o.parent === null)
    }

    const parent = entities[parentId]

    if (!parent) {
      return []
    }

    return parent.children.map((id) => entities[id]!)
  }
)

// drill through the outcome data to derive prefix based on parent outcomes
export const getPrefixPath = createSelector(
  [
    selectRootOutcomeIds,
    selectOutcomeEntities,
    (_: RootState, uuid: string) => id
  ],
  (rootIds, entities, outcomeId) => {
    const path: (number | string)[] = []
    let outcome = entities[outcomeId]

    // if we're immediately working with a level 0 item, bail out early
    // and display code within the prefix (if it exists)
    if (!outcome.parent) {
      const rootIndex = rootIds.indexOf(outcome.uuid)
      return outcome.code
        ? `${rootIndex + 1} - ${outcome.code} - `
        : `${rootIndex + 1}. `
    }

    // otherwise continue looping through parents to figure out the full prefix path
    while (outcome && outcome.parent) {
      const index = entities[outcome.parent].children.indexOf(outcome.uuid)
      path.unshift(index + 1)
      outcome = entities[outcome.parent]
    }

    // after the while loop, we're at level 0 again
    if (outcome.level === 0) {
      const rootIndex = rootIds.indexOf(outcome.uuid)
      path.unshift(rootIndex + 1)
    }

    return `${path.join('.')}. `
  }
)
