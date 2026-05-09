import { createSelector } from 'reselect'

import type { GraphState } from '../graphState'
import type { GraphUuid } from '../model/types'
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

export const selectPendingOperationsByGraphUuid = (
  graphUuid: GraphUuid
) =>
  createSelector([selectPendingOperations], (ops) =>
    ops.filter((op) => op.graphUuid === graphUuid && op.status === 'pending')
  )

// Placeholder projection seam.
// For now, effective projection returns canonical entities unchanged.
export const selectEffectiveNodes = (graphUuid: GraphUuid) =>
  createSelector(
    [selectAllNodes, selectPendingOperationsByGraphUuid(graphUuid)],
    (nodes) => nodes.filter((node) => node.graphUuid === graphUuid)
  )

// Placeholder projection seam.
// Future optimistic overlays can filter/augment edges here.
export const selectEffectiveEdges = (graphUuid: GraphUuid) =>
  createSelector(
    [selectAllEdges, selectPendingOperationsByGraphUuid(graphUuid)],
    (edges) => edges.filter((edge) => edge.graphUuid === graphUuid)
  )
