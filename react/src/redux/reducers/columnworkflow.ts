import { TColumnworkflow } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'
import {
  ColumnActions,
  ColumnWorkflowActions,
  CommonActions,
  NodeActions,
  StrategyActions
} from '@cfRedux/types/enumActions'

/**
 *
 * @param state
 * @param action
 */
function columnWorkflowReducer(
  state: TColumnworkflow[] = [],
  action: AnyAction
): TColumnworkflow[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.columnworkflow) return action.payload.columnworkflow
      return state

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.columnworkflow) return state

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
          ? { ...item, id: action.payload.new_id, no_drag: false }
          : item
      )
    }

    case ColumnWorkflowActions.MOVED_TO: {
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, no_drag: true } : item
      )
    }

    case ColumnActions.DELETE_SELF: {
      return state.filter((item) => item.id !== action.payload.parent_id)
    }

    case ColumnActions.INSERT_BELOW: {
      const new_state = state.slice()
      new_state.push(action.payload.new_through)
      return new_state
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
      const new_state = state.slice()
      new_state.push(...action.payload.columnworkflows_added)
      return new_state
    }

    default:
      return state
  }
}

export default columnWorkflowReducer
