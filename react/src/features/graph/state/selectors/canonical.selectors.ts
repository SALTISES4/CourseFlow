import { createSelector } from 'reselect'

import {
  channelsAdapter,
  edgesAdapter,
  nodesAdapter,
  sectionsAdapter,
  tagsAdapter,
  workflowMetaAdapter
} from '../canonical'
import type { GraphState } from '../graphState'
import type { WorkflowUuid } from '../model/types'

type StateWithGraph = {
  graph: GraphState
}

export const selectGraphState = (state: StateWithGraph): GraphState =>
  state.graph
export const selectGraphCanonical = (state: StateWithGraph) =>
  selectGraphState(state).canonical

export const selectWorkflowMetaState = (state: StateWithGraph) =>
  selectGraphCanonical(state).workflowMeta
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
const workflowMetaSelectors = workflowMetaAdapter.getSelectors(
  selectWorkflowMetaState
)
const tagSelectors = tagsAdapter.getSelectors(selectTagsState)

export const selectAllWorkflowMeta = workflowMetaSelectors.selectAll
export const selectAllSections = sectionSelectors.selectAll
export const selectAllChannels = channelSelectors.selectAll
export const selectAllNodes = nodeSelectors.selectAll
export const selectAllEdges = edgeSelectors.selectAll
export const selectAllTags = tagSelectors.selectAll

export const selectWorkflowMetaByUuid = (workflowUuid: WorkflowUuid) =>
  createSelector([(state: StateWithGraph) => state], (state) =>
    workflowMetaSelectors.selectById(state, workflowUuid)
  )

export const selectSectionsByWorkflowUuid = (workflowUuid: WorkflowUuid) =>
  createSelector([selectAllSections], (sections) =>
    sections.filter((section) => section.workflowUuid === workflowUuid)
  )

export const selectChannelsByWorkflowUuid = (workflowUuid: WorkflowUuid) =>
  createSelector([selectAllChannels], (channels) =>
    channels.filter((channel) => channel.workflowUuid === workflowUuid)
  )

export const selectNodesByWorkflowUuid = (workflowUuid: WorkflowUuid) =>
  createSelector([selectAllNodes], (nodes) =>
    nodes.filter((node) => node.workflowUuid === workflowUuid)
  )

export const selectEdgesByWorkflowUuid = (workflowUuid: WorkflowUuid) =>
  createSelector([selectAllEdges], (edges) =>
    edges.filter((edge) => edge.workflowUuid === workflowUuid)
  )
