import { createSelector } from 'reselect'

import type { GraphState } from '../graphState'
import { selectGraphState } from './canonical.selectors'
import type { GraphResourceLoadState, WorkflowId } from '../model/types'

export const selectGraphLoad = (state: { graph: GraphState }) =>
  selectGraphState(state).graphLoad

export const selectWorkflowLoadState = (workflowId: WorkflowId) =>
  createSelector(
    [selectGraphLoad],
    (graphLoad) => graphLoad.byWorkflowId[workflowId]
  )

const isSucceeded = (
  status: GraphResourceLoadState[keyof GraphResourceLoadState]
) => status === 'succeeded'

export const selectIsWorkflowMetaReady = (workflowId: WorkflowId) =>
  createSelector([selectWorkflowLoadState(workflowId)], (loadState) =>
    loadState ? isSucceeded(loadState.workflowMeta) : false
  )

export const selectIsGraphCoreReady = (workflowId: WorkflowId) =>
  createSelector([selectWorkflowLoadState(workflowId)], (loadState) =>
    loadState
      ? isSucceeded(loadState.sections) &&
        isSucceeded(loadState.channels) &&
        isSucceeded(loadState.nodes) &&
        isSucceeded(loadState.edges)
      : false
  )

export const selectIsWorkflowGraphRenderable = (workflowId: WorkflowId) =>
  createSelector(
    [selectIsWorkflowMetaReady(workflowId), selectIsGraphCoreReady(workflowId)],
    (workflowMetaReady, graphCoreReady) => workflowMetaReady && graphCoreReady
  )

// Workflow page can render top-level shell when metadata is available.
export const canRenderShell = (workflowId: WorkflowId) =>
  selectIsWorkflowMetaReady(workflowId)

// Channels can render once channel entities are loaded.
export const canRenderChannels = (workflowId: WorkflowId) =>
  createSelector([selectWorkflowLoadState(workflowId)], (loadState) =>
    loadState ? isSucceeded(loadState.channels) : false
  )

// Nodes can render only when channels + nodes are loaded.
export const canRenderNodes = (workflowId: WorkflowId) =>
  createSelector(
    [canRenderChannels(workflowId), selectWorkflowLoadState(workflowId)],
    (channelsReady, loadState) =>
      channelsReady && (loadState ? isSucceeded(loadState.nodes) : false)
  )

// Edges can render only when nodes + edges are loaded.
export const canRenderEdges = (workflowId: WorkflowId) =>
  createSelector(
    [canRenderNodes(workflowId), selectWorkflowLoadState(workflowId)],
    (nodesReady, loadState) =>
      nodesReady && (loadState ? isSucceeded(loadState.edges) : false)
  )
