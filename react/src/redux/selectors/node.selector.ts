import type { RootState } from '@cf/redux/store'
import {
  selectAllNodes as selectAllNodesCanonical,
  selectNodeByUuid,
  selectNodeEntityIds as selectNodeEntityIdsCanonical
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { createSelector } from 'reselect'

/** @deprecated Prefer `@cf/features/graph/state/selectors/canonical.selectors` (canonical graph nodes). */
export const selectAllNodes = selectAllNodesCanonical

/** @deprecated Prefer `selectNodeByUuid` from graph canonical selectors. */
export const selectNodeById = (state: RootState, nodeId: string) =>
  selectNodeByUuid(nodeId)(state)

/** @deprecated Prefer `selectNodeEntityIds` from graph canonical selectors. */
export const selectNodeIds = (state: RootState) =>
  selectNodeEntityIdsCanonical(state)

/** Resolved linked channel UUID for the node (replaces legacy numeric `column`). */
export const selectNodeColumn = (nodeUuid: string) =>
  createSelector(
    [(state: RootState) => selectNodeByUuid(nodeUuid)(state)],
    (node) => node?.channelUuid ?? null
  )
