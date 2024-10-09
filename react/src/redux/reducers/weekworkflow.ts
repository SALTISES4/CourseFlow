import {
  CommonActions,
  StrategyActions,
  WeekActions,
  WeekWorkflowActions
} from '@cfRedux/types/enumActions'
import { TWeekworkflow } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function weekworkflowReducer(
  state: TWeekworkflow[] = [] as TWeekworkflow[],
  action: AnyAction
): TWeekworkflow[] {
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
      const newState = state.map((item) => {
        const foundItem = action.payload.weekworkflow.find(
          (newItem) => newItem.id === item.id
        )
        return foundItem ? foundItem : item
      })

      // add missing items
      action.payload.weekworkflow.forEach((newItem) => {
        if (!newState.find((item) => item.id === newItem.id)) {
          newState.push(newItem)
        }
      })

      return newState
    }

    case WeekWorkflowActions.MOVED_TO: {
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, noDrag: true } : item
      )
    }

    case WeekWorkflowActions.CHANGE_ID: {
      return state.map((item) =>
        item.id === action.payload.old_id
          ? { ...item, id: action.payload.new_id, noDrag: false }
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
