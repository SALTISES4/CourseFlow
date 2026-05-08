import {
  CommonActions,
  SectionActions,
  SectionWorkflowActions,
  StrategyActions
} from '@cfRedux/types/enumActions'
import { TSectionworkflow } from '@cfRedux/types/type'
import { UnknownAction } from '@reduxjs/toolkit'

interface ReplaceStoreDataAction extends UnknownAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { sectionworkflow?: TSectionworkflow[] }
}

interface RefreshStoreDataAction extends UnknownAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { sectionworkflow: TSectionworkflow[] }
}

interface MovedToAction extends UnknownAction {
  type: SectionWorkflowActions.MOVED_TO
  payload: { uuid: string }
}

interface ChangeIdAction extends UnknownAction {
  type: SectionWorkflowActions.CHANGE_ID
  payload: { olduuid: string; newuuid: string }
}

interface DeleteSelfSectionAction extends UnknownAction {
  type: SectionActions.DELETE_SELF
  payload: { parentuuid: string }
}

interface InsertBelowSectionAction extends UnknownAction {
  type: SectionActions.INSERT_BELOW
  payload: { newThrough: TSectionworkflow }
}

interface AddStrategyAction extends UnknownAction {
  type: StrategyActions.ADD_STRATEGY
  payload: { newThrough: TSectionworkflow }
}

// Union type for all actions handled by the reducer
type SectionWorkflowActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | MovedToAction
  | ChangeIdAction
  | DeleteSelfSectionAction
  | InsertBelowSectionAction
  | AddStrategyAction

export default function sectionworkflowReducer(
  state: TSectionworkflow[] = [] as TSectionworkflow[],
  action: SectionWorkflowActionTypes
): TSectionworkflow[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA: {
      if (action.payload.sectionworkflow) {
        return action.payload.sectionworkflow
      }
      return state
    }

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.sectionworkflow) {
        return state
      }

      // replace exising items
      const newState = state.map((item) => {
        const foundItem = action.payload.sectionworkflow.find(
          (newItem) => newItem.uuid === item.uuid
        )
        return foundItem ? foundItem : item
      })

      // add missing items
      action.payload.sectionworkflow.forEach((newItem) => {
        if (!newState.find((item) => item.uuid === newItem.uuid)) {
          newState.push(newItem)
        }
      })

      return newState
    }

    case SectionWorkflowActions.MOVED_TO: {
      return state.map((item) =>
        item.uuid === action.payload.uuid ? { ...item, noDrag: true } : item
      )
    }

    case SectionWorkflowActions.CHANGE_ID: {
      return state.map((item) =>
        item.uuid === action.payload.oldId
          ? { ...item, uuid: action.payload.newId, noDrag: false }
          : item
      )
    }

    case SectionActions.DELETE_SELF: {
      return state.filter((item) => item.uuid !== action.payload.parentId)
    }

    case SectionActions.INSERT_BELOW: {
      const newState = state.slice()
      newState.push(action.payload.newThrough)
      return newState
    }

    case StrategyActions.ADD_STRATEGY: {
      const newState = state.slice()
      newState.push(action.payload.newThrough)
      return newState
    }

    default:
      return state
  }
}
