import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import {
  channelsActions,
  edgesActions,
  graphActions,
  nodesActions,
  sectionsActions,
  tagsActions,
  workflowActions
} from './canonical'
import { fetchWorkflowGraphBundle, fetchWorkflowTags } from './graphApi'
import { graphLoadActions } from './graphLoad.slice'
import type { GraphState } from './graphState'
import type { GraphResourceLoadState, GraphUuid } from './model/types'

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
  graphUuid: GraphUuid
): GraphThunk<Promise<BootstrapGraphResult>> => {
  return async (dispatch) => {
    dispatch(graphLoadActions.initializeGraphLoadState({ graphUuid }))

    dispatch(setLoading(graphUuid, 'graph'))
    dispatch(setLoading(graphUuid, 'sections'))
    dispatch(setLoading(graphUuid, 'channels'))
    dispatch(setLoading(graphUuid, 'nodes'))
    dispatch(setLoading(graphUuid, 'edges'))
    dispatch(setLoading(graphUuid, 'tags'))

    const graphPromise = fetchWorkflowGraphBundle(graphUuid)
      .then((bundle) => {
        dispatch(graphActions.upsertOne(bundle.graph))
        if (bundle.workflow) {
          dispatch(workflowActions.upsertOne(bundle.workflow))
        }
        dispatch(sectionsActions.upsertMany(bundle.sections))
        dispatch(channelsActions.upsertMany(bundle.channels))
        dispatch(nodesActions.upsertMany(bundle.nodes))
        dispatch(edgesActions.upsertMany(bundle.edges))

        dispatch(setSucceeded(graphUuid, 'graph'))
        dispatch(setSucceeded(graphUuid, 'sections'))
        dispatch(setSucceeded(graphUuid, 'channels'))
        dispatch(setSucceeded(graphUuid, 'nodes'))
        dispatch(setSucceeded(graphUuid, 'edges'))
      })
      .catch(() => {
        dispatch(setFailed(graphUuid, 'graph'))
        dispatch(setFailed(graphUuid, 'sections'))
        dispatch(setFailed(graphUuid, 'channels'))
        dispatch(setFailed(graphUuid, 'nodes'))
        dispatch(setFailed(graphUuid, 'edges'))
        throw new Error('graph')
      })

    const tagsPromise = fetchWorkflowTags(graphUuid)
      .then((tags) => {
        dispatch(tagsActions.upsertMany(tags))
        dispatch(setSucceeded(graphUuid, 'tags'))
      })
      .catch(() => {
        dispatch(setFailed(graphUuid, 'tags'))
        throw new Error('tags')
      })

    const settled = await Promise.allSettled([graphPromise, tagsPromise])

    const ok = settled.every((result) => result.status === 'fulfilled')

    if (process.env.NODE_ENV !== 'production') {
      // Temporary milestone instrumentation for hydration verification.
      // Safe to remove once full editor migration starts.
      console.debug('[graph bootstrap]', graphUuid, settled)
    }
    return { graphUuid, ok }
  }
}
