import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import { applyGraphDelta } from '../applyGraphDelta'
import {
  createEdgeCommand,
  deleteChannelCommand,
  deleteEdgeCommand,
  deleteNodeCommand,
  deleteSectionCommand,
  insertChannelBelowCommand,
  insertSectionBelowCommand,
  moveNodeCommand,
  renameNodeCommand,
  reorderChannelsCommand,
  reorderSectionsCommand
} from '../graphApi'
import type { GraphState } from '../graphState'
import type {
  CreateEdgeInput,
  DeleteChannelInput,
  DeleteEdgeInput,
  DeleteNodeInput,
  DeleteSectionInput,
  InsertChannelBelowInput,
  InsertSectionBelowInput,
  MoveNodeInput,
  RenameNodeInput,
  ReorderChannelsInput,
  ReorderSectionsInput,
  ResourceUuid
} from '../model/types'
import { graphLoadActions } from '../slices/graphLoad.slice'

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

export const deleteChannel = (
  input: DeleteChannelInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await deleteChannelCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const deleteSection = (
  input: DeleteSectionInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await deleteSectionCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const reorderChannels = (
  input: ReorderChannelsInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await reorderChannelsCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const reorderSections = (
  input: ReorderSectionsInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await reorderSectionsCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const insertSectionBelow = (
  input: InsertSectionBelowInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await insertSectionBelowCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const insertChannelBelow = (
  input: InsertChannelBelowInput
): GraphMutationThunk<Promise<ResourceUuid | void>> => {
  return async (dispatch) => {
    try {
      const delta = await insertChannelBelowCommand(input)
      applyGraphDelta(dispatch, delta)
      return delta.changes.channels.created[0]?.uuid
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}
