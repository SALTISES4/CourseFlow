import { defaultColumnSettings } from '@cf/utility/constants'
import { createSelector } from 'reselect'

import type { GraphState } from '../graphState'
import type {
  EdgeKey,
  GraphUuid,
  ResourceUuid,
  WorkflowUuid
} from '../model/types'
import {
  channelsAdapter,
  edgesAdapter,
  graphAdapter,
  nodesAdapter,
  sectionsAdapter,
  tagsAdapter,
  workflowAdapter
} from '../slices/canonical'

/** Cyclic default column “types” for theme colours (aligned with graph board selector). */
const CYCLIC_DEFAULT_COLUMN_TYPES: number[] = Object.keys(defaultColumnSettings)
  .filter((key) => typeof key !== 'symbol' && key !== 'new-column')
  .map(Number)
  .filter((n) => !Number.isNaN(n))
  .sort((a, b) => a - b)

type StateWithGraph = {
  graph: GraphState
}

export const selectGraphState = (state: StateWithGraph): GraphState =>
  state.graph
export const selectGraphCanonical = (state: StateWithGraph) =>
  selectGraphState(state).canonical

export const selectGraphEntityState = (state: StateWithGraph) =>
  selectGraphCanonical(state).graph
export const selectWorkflowState = (state: StateWithGraph) =>
  selectGraphCanonical(state).workflow
export const selectSectionsState = (state: StateWithGraph) =>
  selectGraphCanonical(state).sections
export const selectChannelsState = (state: StateWithGraph) =>
  selectGraphCanonical(state).channels
export const selectNodesState = (state: StateWithGraph) =>
  selectGraphCanonical(state).nodes
export const selectEdgesState = (state: StateWithGraph) =>
  selectGraphCanonical(state).edges
export const selectTagsState = (state: StateWithGraph) =>
  selectGraphCanonical(state).tags

const sectionSelectors = sectionsAdapter.getSelectors(selectSectionsState)
const channelSelectors = channelsAdapter.getSelectors(selectChannelsState)
const nodeSelectors = nodesAdapter.getSelectors(selectNodesState)
const edgeSelectors = edgesAdapter.getSelectors(selectEdgesState)
const graphSelectors = graphAdapter.getSelectors(selectGraphEntityState)
const workflowSelectors = workflowAdapter.getSelectors(selectWorkflowState)
const tagSelectors = tagsAdapter.getSelectors(selectTagsState)

export const selectAllGraphs = graphSelectors.selectAll
export const selectAllWorkflows = workflowSelectors.selectAll
export const selectAllSections = sectionSelectors.selectAll
export const selectAllChannels = channelSelectors.selectAll
export const selectAllNodes = nodeSelectors.selectAll
export const selectAllEdges = edgeSelectors.selectAll
export const selectAllTags = tagSelectors.selectAll

export const selectGraphByUuid = (graphUuid: GraphUuid) =>
  createSelector([(state: StateWithGraph) => state], (state) =>
    graphSelectors.selectById(state, graphUuid)
  )

export const selectWorkflowByUuid = (workflowUuid: WorkflowUuid) =>
  createSelector([(state: StateWithGraph) => state], (state) =>
    workflowSelectors.selectById(state, workflowUuid)
  )

export const selectChannelByUuid = (channelUuid: ResourceUuid) =>
  createSelector([(state: StateWithGraph) => state], (state) =>
    channelSelectors.selectById(state, channelUuid)
  )

export const selectEdgeByEdgeId = (edgeId: EdgeKey) =>
  createSelector([(state: StateWithGraph) => state], (state) =>
    edgeSelectors.selectById(state, edgeId)
  )

export const selectSectionByUuid = (sectionUuid: ResourceUuid) =>
  createSelector([(state: StateWithGraph) => state], (state) =>
    sectionSelectors.selectById(state, sectionUuid)
  )

/** Adapter `ids` slice order (not necessarily graph `position` order). */
export const selectSectionEntityIds = (state: StateWithGraph) =>
  sectionSelectors.selectIds(state)

export const selectNodeByUuid = (nodeUuid: ResourceUuid) =>
  createSelector([(state: StateWithGraph) => state], (state) =>
    nodeSelectors.selectById(state, nodeUuid)
  )

/** Adapter `ids` slice order (not necessarily layout order). */
export const selectNodeEntityIds = (state: StateWithGraph) =>
  nodeSelectors.selectIds(state)

/**
 * Legacy UI used cyclic column types for colours; canonical channels have no columnType field.
 * Derive the theme index from channel order within the graph (same ordering as the workflow board).
 */
export const selectChannelThemeColumnType = (
  graphUuid: GraphUuid,
  channelUuid: ResourceUuid
) =>
  createSelector([selectChannelsOrderedByGraphUuid(graphUuid)], (channels) => {
    const idx = channels.findIndex((c) => c.uuid === channelUuid)
    const types = CYCLIC_DEFAULT_COLUMN_TYPES
    const typeCount = types.length > 0 ? types.length : 1
    if (idx < 0) {
      return types.length > 0 ? types[0] : 0
    }
    return types.length > 0 ? types[idx % typeCount] : 0
  })

export const selectSectionsByGraphUuid = (graphUuid: GraphUuid) =>
  createSelector([selectAllSections], (sections) =>
    sections.filter((section) => section.graphUuid === graphUuid)
  )

/** Section UUIDs for a graph in canonical `position` order (JumpToMenu / view chrome). */
export const selectSectionUuidsOrderedForGraph = (graphUuid: GraphUuid) =>
  createSelector([selectSectionsByGraphUuid(graphUuid)], (sections) =>
    [...sections].sort((a, b) => a.position - b.position).map((s) => s.uuid)
  )

export const selectChannelsByGraphUuid = (graphUuid: GraphUuid) =>
  createSelector([selectAllChannels], (channels) =>
    channels.filter((channel) => channel.graphUuid === graphUuid)
  )

/** Sections for a graph ordered by canonical `position`. */
export const selectSectionsOrderedByGraphUuid = (graphUuid: GraphUuid) =>
  createSelector([selectSectionsByGraphUuid(graphUuid)], (sections) =>
    [...sections].sort((a, b) => a.position - b.position)
  )

/** Channels for a graph ordered by canonical `position` (column order). */
export const selectChannelsOrderedByGraphUuid = (graphUuid: GraphUuid) =>
  createSelector([selectChannelsByGraphUuid(graphUuid)], (channels) =>
    [...channels].sort((a, b) => a.position - b.position)
  )

export const selectNodesByGraphUuid = (graphUuid: GraphUuid) =>
  createSelector([selectAllNodes], (nodes) =>
    nodes.filter((node) => node.graphUuid === graphUuid)
  )

/** Node UUIDs in graph scope (canonical graph store has no soft-delete flag on nodes). */
export const selectNodeUuidsByGraphUuid = (graphUuid: GraphUuid) =>
  createSelector([selectNodesByGraphUuid(graphUuid)], (nodes) =>
    nodes.map((n) => n.uuid)
  )

export const selectEdgesByGraphUuid = (graphUuid: GraphUuid) =>
  createSelector([selectAllEdges], (edges) =>
    edges.filter((edge) => edge.graphUuid === graphUuid)
  )
