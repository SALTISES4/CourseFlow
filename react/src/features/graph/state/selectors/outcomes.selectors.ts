import type { TagListItemOut } from '@cf/api/gen/types.gen'
import { OutcomeCheckmarkStatus } from '@cf/components/views/WorkflowView/OutcomeTableView/Checkmark'
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

export const selectVisibleOutcomeChildrenById = createSelector(
  [
    selectAllOutcomes,
    (state: StateWithGraph) => state.graph.graphUi.hiddenOutcomeTagIds,
    (_: StateWithGraph, graphUuid: GraphUuid) => graphUuid,
    (
      _: StateWithGraph,
      _graphUuid: GraphUuid,
      parentUuid: ResourceUuid | null
    ) => parentUuid
  ],
  (outcomes, hiddenOutcomeTagIds, graphUuid, parentUuid) =>
    outcomes
      .filter(
        (outcome) =>
          outcome.graphUuid === graphUuid &&
          outcome.parentUuid === parentUuid &&
          !outcome.tagIds.some((tagId) => hiddenOutcomeTagIds.includes(tagId))
      )
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

type TagGroup = {
  uuid: number
  title: string
  outcomes: ResourceUuid[]
}

// to avoid inline array invalidating memoization every time
// since it would return new reference to a new empty array
const EmptyProjectTags: TagListItemOut[] = []

export const selectOutcomeTagGroups = createSelector(
  [
    selectRootOutcomes,
    (
      _: StateWithGraph,
      _graphUuid: GraphUuid,
      projectTags?: TagListItemOut[]
    ) => projectTags ?? EmptyProjectTags
  ],
  (rootOutcomes, projectTags) => {
    const tagGroups: TagGroup[] = []
    const untagged: TagGroup = {
      uuid: -1,
      title: '',
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
          const tagMeta = projectTags.find((tag) => tag.id === tagId)
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

    tagGroups.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    )

    if (untagged.outcomes.length) {
      tagGroups.push({
        ...untagged,
        title: ''
      })
    }

    return tagGroups
  }
)

type OutcomeTagGroupTree = {
  groups: TagGroup[]
  outcomes: Record<ResourceUuid, Outcome>
}

type Outcome = {
  uuid: ResourceUuid
  title: string
  tooltipTitle: string
  level: number
  parent: ResourceUuid | null
  children: ResourceUuid[]
}

export const selectOutcomeTagGroupsTree = createSelector(
  [
    (state: StateWithGraph) => state,
    selectOutcomeEntities,
    (state: StateWithGraph, graphUuid: string) =>
      selectOutcomeTagGroups(state, graphUuid)
  ],
  (state, outcomeEntities, rootTagGroups) => {
    const tree: OutcomeTagGroupTree = {
      groups: rootTagGroups,
      outcomes: {}
    }

    rootTagGroups.forEach((group) => {
      group.outcomes.forEach((outcomeUuid) => {
        parseOutcome(state, tree, outcomeEntities, outcomeUuid)
      })
    })

    return tree
  }
)

// prepare outcome structure to be nested into the outcome tag group tree
function parseOutcome(
  state: StateWithGraph,
  tree: OutcomeTagGroupTree,
  entities: Record<string, OutcomeEntity>,
  uuid: ResourceUuid
) {
  const entity = entities[uuid]

  // early exit if this was parsed already or if it doesn't exist for some reason =o
  if (!entity || tree.outcomes[uuid]) {
    return
  }

  const childrenUuids = selectOutcomeChildrenById(
    state,
    entity.graphUuid,
    entity.uuid
  ).map((c) => c.uuid)

  tree.outcomes[uuid] = {
    uuid: entity.uuid,
    level: selectOutcomeLevel(state, entity.graphUuid, entity.uuid),
    title: getPrefixPath(state, entity.graphUuid, entity.uuid) + entity.title,
    tooltipTitle: entity.title,
    parent: entity.parentUuid,
    children: childrenUuids
  }

  childrenUuids.forEach((uuid) => {
    parseOutcome(state, tree, entities, uuid)
  })
}

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
