import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import { channelsActions, edgesActions, nodesActions, sectionsActions, tagsActions, workflowMetaActions } from './canonical'
import { graphLoadActions } from './graphLoad.slice'
import {
  fetchWorkflowGraphBundle,
  fetchWorkflowMeta,
  fetchWorkflowTags
} from './graphApi'
import type { GraphResourceLoadState, WorkflowId } from './model/types'

import type { GraphState } from './graphState'

type GraphBootstrapState = { graph: GraphState }
type GraphThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  GraphBootstrapState,
  unknown,
  UnknownAction
>

const setLoading = (workflowId: WorkflowId, resource: keyof GraphResourceLoadState) =>
  graphLoadActions.setResourceStatus({
    workflowId,
    resource,
    status: 'loading'
  })

const setSucceeded = (workflowId: WorkflowId, resource: keyof GraphResourceLoadState) =>
  graphLoadActions.setResourceStatus({
    workflowId,
    resource,
    status: 'succeeded'
  })

const setFailed = (workflowId: WorkflowId, resource: keyof GraphResourceLoadState) =>
  graphLoadActions.setResourceStatus({
    workflowId,
    resource,
    status: 'failed'
  })

export type BootstrapGraphResult = {
  workflowId: WorkflowId
  ok: boolean
}

export const bootstrapWorkflowGraph = (
  workflowId: WorkflowId
): GraphThunk<Promise<BootstrapGraphResult>> => {
  return async (dispatch) => {
    dispatch(graphLoadActions.initializeWorkflowLoadState({ workflowId }))

    dispatch(setLoading(workflowId, 'workflowMeta'))
    dispatch(setLoading(workflowId, 'sections'))
    dispatch(setLoading(workflowId, 'channels'))
    dispatch(setLoading(workflowId, 'nodes'))
    dispatch(setLoading(workflowId, 'edges'))
    dispatch(setLoading(workflowId, 'tags'))

    const workflowMetaPromise = fetchWorkflowMeta(workflowId)
      .then((meta) => {
        dispatch(workflowMetaActions.upsertOne(meta))
        dispatch(setSucceeded(workflowId, 'workflowMeta'))
      })
      .catch(() => {
        dispatch(setFailed(workflowId, 'workflowMeta'))
        throw new Error('workflowMeta')
      })

    const graphPromise = fetchWorkflowGraphBundle(workflowId)
      .then((bundle) => {
        dispatch(workflowMetaActions.upsertOne(bundle.workflowMeta))
        dispatch(sectionsActions.upsertMany(bundle.sections))
        dispatch(channelsActions.upsertMany(bundle.channels))
        dispatch(nodesActions.upsertMany(bundle.nodes))
        dispatch(edgesActions.upsertMany(bundle.edges))

        // Meta can be sourced from either dedicated workflow endpoint
        // or graph projection endpoint; mark ready on successful graph payload too.
        dispatch(setSucceeded(workflowId, 'workflowMeta'))
        dispatch(setSucceeded(workflowId, 'sections'))
        dispatch(setSucceeded(workflowId, 'channels'))
        dispatch(setSucceeded(workflowId, 'nodes'))
        dispatch(setSucceeded(workflowId, 'edges'))
      })
      .catch(() => {
        dispatch(setFailed(workflowId, 'sections'))
        dispatch(setFailed(workflowId, 'channels'))
        dispatch(setFailed(workflowId, 'nodes'))
        dispatch(setFailed(workflowId, 'edges'))
        throw new Error('graph')
      })

    const tagsPromise = fetchWorkflowTags(workflowId)
      .then((tags) => {
        dispatch(tagsActions.upsertMany(tags))
        dispatch(setSucceeded(workflowId, 'tags'))
      })
      .catch(() => {
        dispatch(setFailed(workflowId, 'tags'))
        throw new Error('tags')
      })

    const settled = await Promise.allSettled([
      workflowMetaPromise,
      graphPromise,
      tagsPromise
    ])
    const ok = settled.every((result) => result.status === 'fulfilled')
    if (process.env.NODE_ENV !== 'production') {
      // Temporary milestone instrumentation for hydration verification.
      // Safe to remove once full editor migration starts.
      console.debug('[graph bootstrap]', workflowId, settled)
    }
    return { workflowId, ok }
  }
}
