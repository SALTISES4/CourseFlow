import { createSelector } from 'reselect'

import type { GraphState } from '../graphState'
import type { WorkflowId } from '../model/types'
import { optimisticOpsAdapter } from '../optimisticOps.slice'
import {
  selectAllEdges,
  selectAllNodes,
  selectGraphState
} from './canonical.selectors'

const optimisticSelectors = optimisticOpsAdapter.getSelectors(
  (state: { graph: GraphState }) => selectGraphState(state).optimisticOps
)

export const selectPendingOperations = optimisticSelectors.selectAll

export const selectPendingOperationsByWorkflowId = (workflowId: WorkflowId) =>
  createSelector([selectPendingOperations], (ops) =>
    ops.filter((op) => op.workflowId === workflowId && op.status === 'pending')
  )

// Placeholder projection seam.
// For now, effective projection returns canonical entities unchanged.
export const selectEffectiveNodes = (workflowId: WorkflowId) =>
  createSelector(
    [selectAllNodes, selectPendingOperationsByWorkflowId(workflowId)],
    (nodes) => nodes.filter((node) => node.workflowId === workflowId)
  )

// Placeholder projection seam.
// Future optimistic overlays can filter/augment edges here.
export const selectEffectiveEdges = (workflowId: WorkflowId) =>
  createSelector(
    [selectAllEdges, selectPendingOperationsByWorkflowId(workflowId)],
    (edges) => edges.filter((edge) => edge.workflowId === workflowId)
  )
