import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import { applyGraphDelta } from './applyGraphDelta'
import {
  createEdgeCommand,
  deleteEdgeCommand,
  deleteNodeCommand,
  moveNodeCommand,
  renameNodeCommand
} from './graphApi'
import { graphLoadActions } from './graphLoad.slice'
import type { GraphState } from './graphState'
import type {
  CreateEdgeInput,
  DeleteEdgeInput,
  DeleteNodeInput,
  MoveNodeInput,
  RenameNodeInput
} from './model/types'

type GraphMutationState = { graph: GraphState }
type GraphMutationThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  GraphMutationState,
  unknown,
  UnknownAction
>

const markGraphFailed = (graphUuid: string) =>
  graphLoadActions.setResourceStatus({
    graphUuid,
    resource: 'graph',
    status: 'failed'
  })

/**
 * Explicit backend command: renameNode.
 * Current backend contract does not support title mutation on Node yet.
 */
export const renameNode = (
  input: RenameNodeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await renameNodeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

/**
 * Explicit backend command: moveNode commit.
 * No local authoritative layout mutation is performed in frontend reducers.
 */
export const moveNode = (
  input: MoveNodeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await moveNodeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const createEdge = (
  input: CreateEdgeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await createEdgeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const deleteEdge = (
  input: DeleteEdgeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await deleteEdgeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const deleteNode = (
  input: DeleteNodeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await deleteNodeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}
