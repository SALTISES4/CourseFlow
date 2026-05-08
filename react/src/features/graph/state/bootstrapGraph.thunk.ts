import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import {
  channelsActions,
  edgesActions,
  nodesActions,
  sectionsActions,
  tagsActions,
  workflowMetaActions
} from './canonical'
import { fetchWorkflowGraphBundle, fetchWorkflowTags } from './graphApi'
import { graphLoadActions } from './graphLoad.slice'
import type { GraphState } from './graphState'
import type { GraphResourceLoadState, WorkflowUuid } from './model/types'

type GraphBootstrapState = { graph: GraphState }
type GraphThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  GraphBootstrapState,
  unknown,
  UnknownAction
>

const setLoading = (
  workflowUuid: WorkflowUuid,
  resource: keyof GraphResourceLoadState
) =>
  graphLoadActions.setResourceStatus({
    workflowUuid,
    resource,
    status: 'loading'
  })

const setSucceeded = (
  workflowUuid: WorkflowUuid,
  resource: keyof GraphResourceLoadState
) =>
  graphLoadActions.setResourceStatus({
    workflowUuid,
    resource,
    status: 'succeeded'
  })

const setFailed = (
  workflowUuid: WorkflowUuid,
  resource: keyof GraphResourceLoadState
) =>
  graphLoadActions.setResourceStatus({
    workflowUuid,
    resource,
    status: 'failed'
  })

export type BootstrapGraphResult = {
  workflowUuid: WorkflowUuid
  ok: boolean
}

export const bootstrapWorkflowGraph = (
  workflowUuid: WorkflowUuid
): GraphThunk<Promise<BootstrapGraphResult>> => {
  return async (dispatch) => {
    dispatch(graphLoadActions.initializeWorkflowLoadState({ workflowUuid }))

    dispatch(setLoading(workflowUuid, 'workflowMeta'))
    dispatch(setLoading(workflowUuid, 'sections'))
    dispatch(setLoading(workflowUuid, 'channels'))
    dispatch(setLoading(workflowUuid, 'nodes'))
    dispatch(setLoading(workflowUuid, 'edges'))
    dispatch(setLoading(workflowUuid, 'tags'))

    const graphPromise = fetchWorkflowGraphBundle(workflowUuid)
      .then((bundle) => {
        dispatch(workflowMetaActions.upsertOne(bundle.workflowMeta))
        dispatch(sectionsActions.upsertMany(bundle.sections))
        dispatch(channelsActions.upsertMany(bundle.channels))
        dispatch(nodesActions.upsertMany(bundle.nodes))
        dispatch(edgesActions.upsertMany(bundle.edges))

        dispatch(setSucceeded(workflowUuid, 'workflowMeta'))
        dispatch(setSucceeded(workflowUuid, 'sections'))
        dispatch(setSucceeded(workflowUuid, 'channels'))
        dispatch(setSucceeded(workflowUuid, 'nodes'))
        dispatch(setSucceeded(workflowUuid, 'edges'))
      })
      .catch(() => {
        dispatch(setFailed(workflowUuid, 'workflowMeta'))
        dispatch(setFailed(workflowUuid, 'sections'))
        dispatch(setFailed(workflowUuid, 'channels'))
        dispatch(setFailed(workflowUuid, 'nodes'))
        dispatch(setFailed(workflowUuid, 'edges'))
        throw new Error('graph')
      })

    const tagsPromise = fetchWorkflowTags(workflowUuid)
      .then((tags) => {
        dispatch(tagsActions.upsertMany(tags))
        dispatch(setSucceeded(workflowUuid, 'tags'))
      })
      .catch(() => {
        dispatch(setFailed(workflowUuid, 'tags'))
        throw new Error('tags')
      })

    const settled = await Promise.allSettled([graphPromise, tagsPromise])

    const ok = settled.every((result) => result.status === 'fulfilled')

    if (process.env.NODE_ENV !== 'production') {
      // Temporary milestone instrumentation for hydration verification.
      // Safe to remove once full editor migration starts.
      console.debug('[graph bootstrap]', workflowUuid, settled)
    }
    return { workflowUuid, ok }
  }
}
