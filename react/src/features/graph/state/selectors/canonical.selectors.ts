import { createSelector } from 'reselect'

import { channelsAdapter, edgesAdapter, nodesAdapter, sectionsAdapter, tagsAdapter, workflowMetaAdapter } from '../canonical'
import type { GraphState } from '../graphState'
import type { WorkflowId } from '../model/types'

type StateWithGraph = {
  graph: GraphState
}

export const selectGraphState = (state: StateWithGraph): GraphState => state.graph
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
const workflowMetaSelectors = workflowMetaAdapter.getSelectors(selectWorkflowMetaState)
const tagSelectors = tagsAdapter.getSelectors(selectTagsState)

export const selectAllWorkflowMeta = workflowMetaSelectors.selectAll
export const selectAllSections = sectionSelectors.selectAll
export const selectAllChannels = channelSelectors.selectAll
export const selectAllNodes = nodeSelectors.selectAll
export const selectAllEdges = edgeSelectors.selectAll
export const selectAllTags = tagSelectors.selectAll

export const selectWorkflowMetaById = (workflowId: WorkflowId) =>
  createSelector([selectWorkflowMetaState], (metaState) =>
    workflowMetaSelectors.selectById(metaState, workflowId)
  )

export const selectSectionsByWorkflowId = (workflowId: WorkflowId) =>
  createSelector([selectAllSections], (sections) =>
    sections.filter((section) => section.workflowId === workflowId)
  )

export const selectChannelsByWorkflowId = (workflowId: WorkflowId) =>
  createSelector([selectAllChannels], (channels) =>
    channels.filter((channel) => channel.workflowId === workflowId)
  )

export const selectNodesByWorkflowId = (workflowId: WorkflowId) =>
  createSelector([selectAllNodes], (nodes) =>
    nodes.filter((node) => node.workflowId === workflowId)
  )

export const selectEdgesByWorkflowId = (workflowId: WorkflowId) =>
  createSelector([selectAllEdges], (edges) =>
    edges.filter((edge) => edge.workflowId === workflowId)
  )
