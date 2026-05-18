import type { GraphMutationEnvelope } from './model/types'
import {
  channelsActions,
  edgesActions,
  graphActions,
  nodesActions,
  sectionsActions,
  tagsActions
} from './slices/canonical'

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
    graphActions.updateRevision({
      graphUuid: envelope.graphUuid,
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
    envelope.changes.channels.created.length ||
    envelope.changes.channels.updated.length
  ) {
    dispatch(
      channelsActions.upsertMany([
        ...envelope.changes.channels.created,
        ...envelope.changes.channels.updated
      ])
    )
  }

  if (envelope.changes.channels.deleted.length) {
    dispatch(
      channelsActions.removeManyByUuid(envelope.changes.channels.deleted)
    )
  }

  if (
    envelope.changes.sections.created.length ||
    envelope.changes.sections.updated.length
  ) {
    dispatch(
      sectionsActions.upsertMany([
        ...envelope.changes.sections.created,
        ...envelope.changes.sections.updated
      ])
    )
  }

  if (envelope.changes.sections.deleted.length) {
    dispatch(
      sectionsActions.removeManyByUuid(envelope.changes.sections.deleted)
    )
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
