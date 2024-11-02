import {
  ColumnActions,
  ColumnWorkflowActions,
  CommonActions,
  NodeActions,
  StrategyActions
} from '@cfRedux/types/enumActions'
import { TColumnworkflow } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

interface ReplaceStoreDataAction extends AnyAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { columnworkflow?: TColumnworkflow[] }
}

interface RefreshStoreDataAction extends AnyAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { columnworkflow: TColumnworkflow[] }
}

interface ChangeIdAction extends AnyAction {
  type: ColumnWorkflowActions.CHANGE_ID
  payload: { old_id: number; new_id: number }
}

interface MovedToAction extends AnyAction {
  type: ColumnWorkflowActions.MOVED_TO
  payload: { id: number }
}

interface DeleteSelfAction extends AnyAction {
  type: ColumnActions.DELETE_SELF
  payload: { parent_id: number }
}

interface InsertBelowAction extends AnyAction {
  type: ColumnActions.INSERT_BELOW
  payload: { new_through: TColumnworkflow }
}

interface NewNodeAction extends AnyAction {
  type: NodeActions.NEW_NODE
  payload: { columnworkflow: TColumnworkflow }
}

interface AddStrategyAction extends AnyAction {
  type: StrategyActions.ADD_STRATEGY
  payload: { columnworkflows_added: TColumnworkflow[] }
}

// Union type for all actions handled by the reducer
type ColumnWorkflowActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | ChangeIdAction
  | MovedToAction
  | DeleteSelfAction
  | InsertBelowAction
  | NewNodeAction
  | AddStrategyAction

/**
 *
 * @param state
 * @param action
 */
function columnWorkflowReducer(
  state: TColumnworkflow[] = [],
  action: ColumnWorkflowActionTypes
): TColumnworkflow[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.columnworkflow) {
        return action.payload.columnworkflow
      }
      return state

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.columnworkflow) {
        return state
      }

      return action.payload.columnworkflow.reduce(
        (acc, newItem) => {
          const existingIndex = acc.findIndex((item) => item.id === newItem.id)
          if (existingIndex !== -1) {
            acc.splice(existingIndex, 1, newItem) // Replace the item at the found index
          } else {
            acc.push(newItem) // Add the new item if not found
          }
          return acc
        },
        [...state]
      )
    }

    case ColumnWorkflowActions.CHANGE_ID: {
      return state.map((item) =>
        item.id === action.payload.old_id
          ? { ...item, id: action.payload.new_id, noDrag: false }
          : item
      )
    }

    case ColumnWorkflowActions.MOVED_TO: {
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, noDrag: true } : item
      )
    }

    case ColumnActions.DELETE_SELF: {
      return state.filter((item) => item.id !== action.payload.parent_id)
    }

    case ColumnActions.INSERT_BELOW: {
      const newState = state.slice()
      newState.push(action.payload.new_through)
      return newState
    }

    case NodeActions.NEW_NODE: {
      const exists = state.some(
        (item) => item.id === action.payload.columnworkflow.id
      )
      return exists ? state : [...state, action.payload.columnworkflow]
    }

    case StrategyActions.ADD_STRATEGY: {
      if (action.payload.columnworkflows_added.length == 0) {
        return state
      }
      const newState = state.slice()
      newState.push(...action.payload.columnworkflows_added)
      return newState
    }

    default:
      return state
  }
}

export default columnWorkflowReducer
