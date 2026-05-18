import { createSelector } from 'reselect'

import type { GraphState } from '../graphState'
import { selectGraphState } from './canonical.selectors'
import type { GraphResourceLoadState, GraphUuid } from '../model/types'

export const selectGraphLoad = (state: { graph: GraphState }) =>
  selectGraphState(state).graphLoad

export const selectWorkflowLoadState = (graphUuid: GraphUuid) =>
  createSelector(
    [selectGraphLoad],
    (graphLoad) => graphLoad.byGraphUuid[graphUuid]
  )

const isSucceeded = (
  status: GraphResourceLoadState[keyof GraphResourceLoadState]
) => status === 'succeeded'

export const selectIsGraphReady = (graphUuid: GraphUuid) =>
  createSelector([selectWorkflowLoadState(graphUuid)], (loadState) =>
    loadState ? isSucceeded(loadState.graph) : false
  )

export const selectIsGraphCoreReady = (graphUuid: GraphUuid) =>
  createSelector([selectWorkflowLoadState(graphUuid)], (loadState) =>
    loadState
      ? isSucceeded(loadState.sections) &&
        isSucceeded(loadState.channels) &&
        isSucceeded(loadState.nodes) &&
        isSucceeded(loadState.edges)
      : false
  )

export const selectIsWorkflowGraphRenderable = (graphUuid: GraphUuid) =>
  createSelector(
    [selectIsGraphReady(graphUuid), selectIsGraphCoreReady(graphUuid)],
    (graphReady, graphCoreReady) => graphReady && graphCoreReady
  )

// Workflow page can render top-level shell when metadata is available.
export const canRenderShell = (graphUuid: GraphUuid) =>
  selectIsGraphReady(graphUuid)

// Channels can render once channel entities are loaded.
export const canRenderChannels = (graphUuid: GraphUuid) =>
  createSelector([selectWorkflowLoadState(graphUuid)], (loadState) =>
    loadState ? isSucceeded(loadState.channels) : false
  )

// Nodes can render only when channels + nodes are loaded.
export const canRenderNodes = (graphUuid: GraphUuid) =>
  createSelector(
    [canRenderChannels(graphUuid), selectWorkflowLoadState(graphUuid)],
    (channelsReady, loadState) =>
      channelsReady && (loadState ? isSucceeded(loadState.nodes) : false)
  )

// Edges can render only when nodes + edges are loaded.
export const canRenderEdges = (graphUuid: GraphUuid) =>
  createSelector(
    [canRenderNodes(graphUuid), selectWorkflowLoadState(graphUuid)],
    (nodesReady, loadState) =>
      nodesReady && (loadState ? isSucceeded(loadState.edges) : false)
  )
