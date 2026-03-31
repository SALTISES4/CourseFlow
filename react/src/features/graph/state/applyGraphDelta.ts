import {
  edgesActions,
  nodesActions,
  tagsActions,
  workflowMetaActions
} from './canonical'
import type { GraphMutationEnvelope } from './model/types'

type DispatchLike = (action: unknown) => void

/**
 * Apply backend-authoritative graph mutation delta into canonical graph state.
 * This function intentionally contains no local graph business logic.
 */
export const applyGraphDelta = (
  dispatch: DispatchLike,
  envelope: GraphMutationEnvelope
) => {
  dispatch(
    workflowMetaActions.updateRevision({
      workflowUuid: envelope.workflowUuid,
      revisionId: envelope.revisionId
    })
  )

  if (
    envelope.changes.nodes.created.length ||
    envelope.changes.nodes.updated.length
  ) {
    dispatch(
      nodesActions.upsertMany([
        ...envelope.changes.nodes.created,
        ...envelope.changes.nodes.updated
      ])
    )
  }

  if (envelope.changes.nodes.deleted.length) {
    dispatch(nodesActions.removeManyByUuid(envelope.changes.nodes.deleted))
  }

  if (
    envelope.changes.edges.created.length ||
    envelope.changes.edges.updated.length
  ) {
    dispatch(
      edgesActions.upsertMany([
        ...envelope.changes.edges.created,
        ...envelope.changes.edges.updated
      ])
    )
  }

  if (envelope.changes.edges.deleted.length) {
    dispatch(edgesActions.removeManyByEdgeId(envelope.changes.edges.deleted))
  }

  if (
    envelope.changes.tags.created.length ||
    envelope.changes.tags.updated.length
  ) {
    dispatch(
      tagsActions.upsertMany([
        ...envelope.changes.tags.created,
        ...envelope.changes.tags.updated
      ])
    )
  }

  if (envelope.changes.tags.deleted.length) {
    dispatch(tagsActions.removeManyByTagId(envelope.changes.tags.deleted))
  }
}
