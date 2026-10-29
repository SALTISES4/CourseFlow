import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import { fetchWorkflowGraphBundle } from '../graphApi'
import type { GraphState } from '../graphState'
import type { GraphResourceLoadState, GraphUuid } from '../model/types'
import {
  channelsActions,
  edgesActions,
  graphActions,
  nodesActions,
  outcomesActions,
  sectionsActions,
  tagsActions,
  workflowActions
} from '../slices/canonical'
import { graphLoadActions } from '../slices/graphLoad.slice'
import { threadCommentCountsActions } from '../slices/threadCommentCounts.slice'

type GraphBootstrapState = { graph: GraphState }
type GraphThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  GraphBootstrapState,
  unknown,
  UnknownAction
>

const setLoading = (
  graphUuid: GraphUuid,
  resource: keyof GraphResourceLoadState
) =>
  graphLoadActions.setResourceStatus({
    graphUuid,
    resource,
    status: 'loading'
  })

const setSucceeded = (
  graphUuid: GraphUuid,
  resource: keyof GraphResourceLoadState
) =>
  graphLoadActions.setResourceStatus({
    graphUuid,
    resource,
    status: 'succeeded'
  })

const setFailed = (
  graphUuid: GraphUuid,
  resource: keyof GraphResourceLoadState
) =>
  graphLoadActions.setResourceStatus({
    graphUuid,
    resource,
    status: 'failed'
  })

export type BootstrapGraphResult = {
  graphUuid: GraphUuid
  ok: boolean
}

export const bootstrapWorkflowGraph = (
  graphUuid: GraphUuid,
  publicView = false
): GraphThunk<Promise<BootstrapGraphResult>> => {
  return async (dispatch) => {
    dispatch(graphLoadActions.initializeGraphLoadState({ graphUuid }))

    dispatch(setLoading(graphUuid, 'graph'))
    dispatch(setLoading(graphUuid, 'sections'))
    dispatch(setLoading(graphUuid, 'channels'))
    dispatch(setLoading(graphUuid, 'nodes'))
    dispatch(setLoading(graphUuid, 'edges'))
    dispatch(setLoading(graphUuid, 'tags'))
    dispatch(setLoading(graphUuid, 'outcomes'))

    const graphPromise = fetchWorkflowGraphBundle(graphUuid, publicView)
      .then((bundle) => {
        dispatch(graphActions.upsertOne(bundle.graph))
        if (bundle.workflow) {
          dispatch(workflowActions.upsertOne(bundle.workflow))
        }
        dispatch(sectionsActions.upsertMany(bundle.sections))
        dispatch(channelsActions.upsertMany(bundle.channels))
        dispatch(nodesActions.upsertMany(bundle.nodes))
        dispatch(edgesActions.upsertMany(bundle.edges))
        dispatch(outcomesActions.upsertMany(bundle.outcomes))
        dispatch(tagsActions.upsertMany(bundle.tags))
        dispatch(
          threadCommentCountsActions.upsertMany(bundle.threadCommentCounts)
        )

        dispatch(setSucceeded(graphUuid, 'graph'))
        dispatch(setSucceeded(graphUuid, 'sections'))
        dispatch(setSucceeded(graphUuid, 'channels'))
        dispatch(setSucceeded(graphUuid, 'nodes'))
        dispatch(setSucceeded(graphUuid, 'edges'))
        dispatch(setSucceeded(graphUuid, 'tags'))
        dispatch(setSucceeded(graphUuid, 'outcomes'))
      })
      .catch(() => {
        dispatch(setFailed(graphUuid, 'graph'))
        dispatch(setFailed(graphUuid, 'sections'))
        dispatch(setFailed(graphUuid, 'channels'))
        dispatch(setFailed(graphUuid, 'nodes'))
        dispatch(setFailed(graphUuid, 'edges'))
        dispatch(setFailed(graphUuid, 'tags'))
        dispatch(setFailed(graphUuid, 'outcomes'))
        throw new Error('graph')
      })

    const settled = await Promise.allSettled([graphPromise])

    const ok = settled.every((result) => result.status === 'fulfilled')

    if (process.env.NODE_ENV !== 'production') {
      // Temporary milestone instrumentation for hydration verification.
      // Safe to remove once full editor migration starts.
      console.debug('[graph bootstrap]', graphUuid, settled)
    }
    return { graphUuid, ok }
  }
}
