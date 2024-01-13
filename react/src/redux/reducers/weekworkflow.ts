import { Weekworkflow } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'
import {
  CommonActions,
  StrategyActions,
  WeekActions,
  WeekWorkflowActions
} from '@cfRedux/enumActions'

export default function weekworkflowReducer(
  state: Weekworkflow[] = [] as Weekworkflow[],
  action: AnyAction
): Weekworkflow[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA: {
      if (action.payload.weekworkflow) {
        return action.payload.weekworkflow
      }
      return state
    }

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.weekworkflow) {
        return state
      }

      // replace exising items
      const new_state = state.map((item) => {
        const foundItem = action.payload.weekworkflow.find(
          (newItem) => newItem.id === item.id
        )
        return foundItem ? foundItem : item
      })

      // add missing items
      action.payload.weekworkflow.forEach((newItem) => {
        if (!new_state.find((item) => item.id === newItem.id)) {
          new_state.push(newItem)
        }
      })

      return new_state
    }

    case WeekWorkflowActions.MOVED_TO: {
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, no_drag: true } : item
      )
    }

    case WeekWorkflowActions.CHANGE_ID: {
      return state.map((item) =>
        item.id === action.payload.old_id
          ? { ...item, id: action.payload.new_id, no_drag: false }
          : item
      )
    }

    case WeekActions.DELETE_SELF: {
      return state.filter((item) => item.id !== action.payload.parent_id)
    }

    case WeekActions.INSERT_BELOW: {
      const newState = state.slice()
      newState.push(action.payload.new_through)
      return newState
    }

    case StrategyActions.ADD_STRATEGY: {
      const newState = state.slice()
      newState.push(action.payload.new_through)
      return newState
    }

    default:
      return state
  }
}
