import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'

import { applyGraphDelta } from '../applyGraphDelta'
import {
  buildChannelMetaMutationEnvelope,
  buildSectionMetaMutationEnvelope,
  changeChannelMetaCommand,
  changeNodeMetaCommand,
  changeSectionMetaCommand,
  createEdgeCommand,
  deleteChannelCommand,
  deleteEdgeCommand,
  updateEdgeCommand,
  deleteNodeCommand,
  deleteSectionCommand,
  insertChannelBelowCommand,
  insertNodeBelowCommand,
  insertSectionBelowCommand,
  linkNodeOutcomeCommand,
  linkNodeWorkflowCommand,
  moveNodeCommand,
  moveNodeGridCommand,
  placeNodeCommand,
  renameNodeCommand,
  reorderChannelsCommand,
  reorderSectionsCommand,
  unlinkNodeOutcomeCommand
} from '../graphApi'
import type { GraphState } from '../graphState'
import type {
  ChangeNodeMetaInput,
  ChangeSectionMetaInput,
  ChangeChannelMetaInput,
  CreateEdgeInput,
  DeleteChannelInput,
  DeleteEdgeInput,
  UpdateEdgeInput,
  DeleteNodeInput,
  DeleteSectionInput,
  InsertChannelBelowInput,
  InsertNodeBelowInput,
  InsertSectionBelowInput,
  LinkNodeOutcomeInput,
  LinkNodeWorkflowInput,
  MoveNodeGridInput,
  MoveNodeInput,
  PlaceNodeInput,
  RenameNodeInput,
  ReorderChannelsInput,
  ReorderSectionsInput,
  ResourceUuid,
  UnlinkNodeOutcomeInput
} from '../model/types'
import { selectGraphByUuid } from '../selectors/canonical.selectors'
import { workflowActions } from '../slices/canonical/workflow.slice'
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
 * Legacy patch placement (explicit coordinates). Prefer `moveNodeGrid` in the editor.
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

/**
 * Grid move: backend computes placement and sibling reflow.
 */
export const moveNodeGrid = (
  input: MoveNodeGridInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await moveNodeGridCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const insertNodeBelow = (
  input: InsertNodeBelowInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await insertNodeBelowCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const placeNode = (
  input: PlaceNodeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await placeNodeCommand(input)
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

export const updateEdge = (
  input: UpdateEdgeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await updateEdgeCommand(input)
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

/**
 * Resource PATCH for section metadata (title, position, thread).
 * Backend returns `SectionOutResp`; canonical state is updated via a synthetic envelope.
 */
export const linkNodeOutcome = (
  input: LinkNodeOutcomeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await linkNodeOutcomeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const unlinkNodeOutcome = (
  input: UnlinkNodeOutcomeInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await unlinkNodeOutcomeCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const changeNodeMeta = (
  input: ChangeNodeMetaInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await changeNodeMetaCommand(input)
      applyGraphDelta(dispatch, delta)
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const linkNodeWorkflow = (
  input: LinkNodeWorkflowInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const delta = await linkNodeWorkflowCommand(input)
      applyGraphDelta(dispatch, delta)
      if (input.linkedWorkflow) {
        dispatch(workflowActions.upsertOne(input.linkedWorkflow))
      }
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

export const changeSectionMeta = (
  input: ChangeSectionMetaInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      const section = await changeSectionMetaCommand(input)
      const graph = selectGraphByUuid(input.graphUuid)(getState())
      const revisionId = graph?.revisionId ?? 0
      applyGraphDelta(
        dispatch,
        buildSectionMetaMutationEnvelope(input.graphUuid, revisionId, section)
      )
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}

/**
 * Resource PATCH for channel metadata (title, position, thread).
 * Backend returns `ChannelOutResp`; canonical state is updated via a synthetic envelope.
 */
export const changeChannelMeta = (
  input: ChangeChannelMetaInput
): GraphMutationThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      const channel = await changeChannelMetaCommand(input)
      const graph = selectGraphByUuid(input.graphUuid)(getState())
      const revisionId = graph?.revisionId ?? 0
      applyGraphDelta(
        dispatch,
        buildChannelMetaMutationEnvelope(input.graphUuid, revisionId, channel)
      )
    } catch (error) {
      dispatch(markGraphFailed(input.graphUuid))
      throw error
    }
  }
}
