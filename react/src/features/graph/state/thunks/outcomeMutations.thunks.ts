import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import { applyGraphDelta } from '../applyGraphDelta'
import {
  createOutcomeCommand,
  deleteOutcomeCommand,
  duplicateOutcomeCommand,
  moveOutcomeCommand,
  updateOutcomeCommand
} from '../graphApi'
import type { GraphState } from '../graphState'
import type {
  CreateOutcomeInput,
  DeleteOutcomeInput,
  DuplicateOutcomeInput,
  MoveOutcomeInput,
  UpdateOutcomeInput
} from '../model/types'
import { graphLoadActions } from '../slices/graphLoad.slice'

type OutcomeMutationState = { graph: GraphState }
type OutcomeMutationThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  OutcomeMutationState,
  unknown,
  UnknownAction
>

const markGraphFailed = (graphUuid: string) =>
  graphLoadActions.setResourceStatus({
    graphUuid,
    resource: 'outcomes',
    status: 'failed'
  })

export const createOutcome = (
  input: CreateOutcomeInput
): OutcomeMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await createOutcomeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const updateOutcome = (
  input: UpdateOutcomeInput
): OutcomeMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await updateOutcomeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const deleteOutcome = (
  input: DeleteOutcomeInput
): OutcomeMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await deleteOutcomeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const duplicateOutcome = (
  input: DuplicateOutcomeInput
): OutcomeMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await duplicateOutcomeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const moveOutcome = (
  input: MoveOutcomeInput
): OutcomeMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await moveOutcomeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}
