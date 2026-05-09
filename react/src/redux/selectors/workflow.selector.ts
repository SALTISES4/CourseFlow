import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

import { selectColumnEntities } from './column.selector'
import { selectGraphBoard as graphSelectGraphBoard } from '../../features/graph/state/selectors/graph-board.selectors'
import type { GraphBoard as GraphWorkflowBoard } from '../../features/graph/state/selectors/graph-board.selectors'

export type WorkflowBoard = GraphWorkflowBoard

/**
 * Canonical graph board for the graph identified by route via `workflowUuid` (need to look up the graph uuid)
 * Does not depend on legacy `state.workspace.workflow`.
 */
export function selectGraphBoard(state: RootState, graphUuid: string) {
  return graphSelectGraphBoard(
    state as Parameters<typeof graphSelectGraphBoard>[0],
    graphUuid
  )
}

// grabs columns associated to the current workflow
export const selectGraphColumns = (state: RootState): number[] => {
  const st = state as RootState & {
    workspace?: { workflow?: { columns?: number[] } }
  }
  return st.workspace?.workflow?.columns ?? []
}

// filters through the columns
// (some of them might be soft deleted too and wouldn't appear)
// TODO: maybe this is unnecessary if soft delete is being removed
export const selectGraphColumnEntities = createSelector(
  [selectGraphColumns, selectColumnEntities],
  (columnIds, columnEntities) => {
    return columnIds.map((id) => columnEntities[id]).filter(Boolean)
  }
)
