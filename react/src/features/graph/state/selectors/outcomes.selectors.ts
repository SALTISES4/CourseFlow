import { _t } from '@cf/utility/Utility.class'
import editTabNodeData from '@cfSidebar/components/EditTab/components/EditNode/optionsData'
import { createSelector } from 'reselect'

import type { GraphState } from '../graphState'
import type { GraphUuid, OutcomeEntity, ResourceUuid } from '../model/types'
import { outcomesAdapter } from '../slices/canonical/outcomes.slice'

type StateWithGraph = { graph: GraphState }

const selectGraphState = (state: StateWithGraph) => state.graph

const selectOutcomesState = createSelector(
  selectGraphState,
  (graph) => graph.canonical.outcomes
)

export const {
  selectAll: selectAllOutcomes,
  selectById: selectOutcomeById,
  selectIds: selectOutcomeIds,
  selectEntities: selectOutcomeEntities
} = outcomesAdapter.getSelectors(selectOutcomesState)

export const selectRootOutcomes = createSelector(
  [selectAllOutcomes, (_: StateWithGraph, graphUuid: GraphUuid) => graphUuid],
  (outcomes, graphUuid) =>
    outcomes
      .filter((o) => o.graphUuid === graphUuid && o.parentUuid === null)
      .sort((a, b) => a.order - b.order)
)

export const selectOutcomeChildren = createSelector(
  [
    selectAllOutcomes,
    (
      _: StateWithGraph,
      _graphUuid: GraphUuid,
      parentUuid: ResourceUuid | null
    ) => parentUuid
  ],
  (outcomes, parentUuid) =>
    outcomes
      .filter((o) => o.parentUuid === parentUuid)
      .sort((a, b) => a.order - b.order)
)

export const selectOutcomeChildrenById = createSelector(
  [
    selectAllOutcomes,
    (_: StateWithGraph, graphUuid: GraphUuid) => graphUuid,
    (
      _: StateWithGraph,
      _graphUuid: GraphUuid,
      parentUuid: ResourceUuid | null
    ) => parentUuid
  ],
  (outcomes, graphUuid, parentUuid) =>
    outcomes
      .filter((o) => o.graphUuid === graphUuid && o.parentUuid === parentUuid)
      .sort((a, b) => a.order - b.order)
)

export const selectHighlightedOutcomes = createSelector(
  selectGraphState,
  (graph) => graph.outcomeUi.highlightedOutcomeUuids
)

export const isHighlightedViaOutcome = createSelector(
  [
    selectHighlightedOutcomes,
    (_: StateWithGraph, searchUuids: ResourceUuid[]) => searchUuids
  ],
  (haystack, needle) => needle.some((n) => haystack.includes(n))
)

const tagsData = editTabNodeData.tags

type TagGroup = {
  uuid: number
  title: string
  outcomes: ResourceUuid[]
}

export const selectOutcomeTagGroups = createSelector(
  [selectRootOutcomes, (_: StateWithGraph, graphUuid: GraphUuid) => graphUuid],
  (rootOutcomes) => {
    const tagGroups: TagGroup[] = []
    const untagged: TagGroup = {
      uuid: -1,
      title: _t('Untagged'),
      outcomes: []
    }

    for (const outcome of rootOutcomes) {
      if (!outcome.tagIds?.length) {
        untagged.outcomes.push(outcome.uuid)
        continue
      }

      for (const tagId of outcome.tagIds) {
        const foundIndex = tagGroups.findIndex((t) => t.uuid === tagId)
        if (foundIndex === -1) {
          const tagMeta = tagsData.find((t) => t.uuid === tagId)
          tagGroups.push({
            uuid: tagId,
            title: tagMeta?.label ?? String(tagId),
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

export const getPrefixPath = createSelector(
  [
    selectRootOutcomes,
    selectOutcomeEntities,
    (_: StateWithGraph, _graphUuid: GraphUuid, outcomeUuid: ResourceUuid) =>
      outcomeUuid
  ],
  (rootOutcomes, entities, outcomeUuid) => {
    const path: (number | string)[] = []
    let outcome = entities[outcomeUuid]
    if (!outcome) {
      return ''
    }

    if (!outcome.parentUuid) {
      const rootIndex = rootOutcomes.findIndex((o) => o.uuid === outcome.uuid)
      return outcome.code
        ? `${rootIndex + 1} - ${outcome.code} - `
        : `${rootIndex + 1}. `
    }

    while (outcome?.parentUuid) {
      const parent = entities[outcome.parentUuid]
      if (!parent) {
        break
      }
      const siblings = Object.values(entities)
        .filter((o): o is OutcomeEntity => !!o && o.parentUuid === parent.uuid)
        .sort((a, b) => a.order - b.order)
      const index = siblings.findIndex((o) => o.uuid === outcome!.uuid)
      path.unshift(index + 1)
      outcome = parent
    }

    if (outcome && !outcome.parentUuid) {
      const rootIndex = rootOutcomes.findIndex((o) => o.uuid === outcome!.uuid)
      path.unshift(rootIndex + 1)
    }

    return `${path.join('.')}. `
  }
)

export const selectOutcomeLevel = createSelector(
  [
    selectOutcomeEntities,
    (_: StateWithGraph, _graphUuid: GraphUuid, outcomeUuid: ResourceUuid) =>
      outcomeUuid
  ],
  (entities, outcomeUuid) => {
    let level = 0
    let current = entities[outcomeUuid]
    while (current?.parentUuid) {
      level += 1
      current = entities[current.parentUuid]
    }
    return level
  }
)

export function isOutcomeLink(data: Record<string | symbol, unknown>): data is {
  uuid: ResourceUuid
  type: 'link_outcome'
} {
  return 'uuid' in data && 'type' in data && data.type === 'link_outcome'
}
