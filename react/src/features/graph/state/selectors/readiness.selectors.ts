import { createSelector } from 'reselect'

import type { GraphState } from '../graphState'
import { selectGraphState } from './canonical.selectors'
import type { GraphResourceLoadState, WorkflowUuid } from '../model/types'

export const selectGraphLoad = (state: { graph: GraphState }) =>
  selectGraphState(state).graphLoad

export const selectWorkflowLoadState = (workflowUuid: WorkflowUuid) =>
  createSelector(
    [selectGraphLoad],
    (graphLoad) => graphLoad.byWorkflowUuid[workflowUuid]
  )

const isSucceeded = (
  status: GraphResourceLoadState[keyof GraphResourceLoadState]
) => status === 'succeeded'

export const selectIsWorkflowMetaReady = (workflowUuid: WorkflowUuid) =>
  createSelector([selectWorkflowLoadState(workflowUuid)], (loadState) =>
    loadState ? isSucceeded(loadState.workflowMeta) : false
  )

export const selectIsGraphCoreReady = (workflowUuid: WorkflowUuid) =>
  createSelector([selectWorkflowLoadState(workflowUuid)], (loadState) =>
    loadState
      ? isSucceeded(loadState.sections) &&
        isSucceeded(loadState.channels) &&
        isSucceeded(loadState.nodes) &&
        isSucceeded(loadState.edges)
      : false
  )

export const selectIsWorkflowGraphRenderable = (workflowUuid: WorkflowUuid) =>
  createSelector(
    [
      selectIsWorkflowMetaReady(workflowUuid),
      selectIsGraphCoreReady(workflowUuid)
    ],
    (workflowMetaReady, graphCoreReady) => workflowMetaReady && graphCoreReady
  )

// Workflow page can render top-level shell when metadata is available.
export const canRenderShell = (workflowUuid: WorkflowUuid) =>
  selectIsWorkflowMetaReady(workflowUuid)

// Channels can render once channel entities are loaded.
export const canRenderChannels = (workflowUuid: WorkflowUuid) =>
  createSelector([selectWorkflowLoadState(workflowUuid)], (loadState) =>
    loadState ? isSucceeded(loadState.channels) : false
  )

// Nodes can render only when channels + nodes are loaded.
export const canRenderNodes = (workflowUuid: WorkflowUuid) =>
  createSelector(
    [canRenderChannels(workflowUuid), selectWorkflowLoadState(workflowUuid)],
    (channelsReady, loadState) =>
      channelsReady && (loadState ? isSucceeded(loadState.nodes) : false)
  )

// Edges can render only when nodes + edges are loaded.
export const canRenderEdges = (workflowUuid: WorkflowUuid) =>
  createSelector(
    [canRenderNodes(workflowUuid), selectWorkflowLoadState(workflowUuid)],
    (nodesReady, loadState) =>
      nodesReady && (loadState ? isSucceeded(loadState.edges) : false)
  )
