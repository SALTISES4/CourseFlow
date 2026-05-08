import { createSelector } from 'reselect'

import type { GraphState } from '../graphState'
import type { WorkflowUuid } from '../model/types'
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

export const selectPendingOperationsByWorkflowUuid = (
  workflowUuid: WorkflowUuid
) =>
  createSelector([selectPendingOperations], (ops) =>
    ops.filter(
      (op) => op.workflowUuid === workflowUuid && op.status === 'pending'
    )
  )

// Placeholder projection seam.
// For now, effective projection returns canonical entities unchanged.
export const selectEffectiveNodes = (workflowUuid: WorkflowUuid) =>
  createSelector(
    [selectAllNodes, selectPendingOperationsByWorkflowUuid(workflowUuid)],
    (nodes) => nodes.filter((node) => node.workflowUuid === workflowUuid)
  )

// Placeholder projection seam.
// Future optimistic overlays can filter/augment edges here.
export const selectEffectiveEdges = (workflowUuid: WorkflowUuid) =>
  createSelector(
    [selectAllEdges, selectPendingOperationsByWorkflowUuid(workflowUuid)],
    (edges) => edges.filter((edge) => edge.workflowUuid === workflowUuid)
  )
