import {
  CommonActions,
  NodeActions,
  NodeWeekActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/enumActions'
import { TNodeweek } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function nodeweekReducer(
  state: TNodeweek[] = [],
  action: AnyAction
): TNodeweek[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.nodeweek) return action.payload.nodeweek
      return state

    case CommonActions.REFRESH_STOREDATA:
      return action.payload.nodeweek
        ? action.payload.nodeweek.reduce(
            (updatedState, newNodeWeek) => {
              const index = updatedState.findIndex(
                (item) => item.id === newNodeWeek.id
              )
              if (index !== -1) {
                updatedState.splice(index, 1, newNodeWeek)
              } else {
                updatedState.push(newNodeWeek)
              }
              return updatedState
            },
            [...state]
          )
        : state

    case NodeWeekActions.CHANGE_ID:
      return state.map((item) =>
        item.id === action.payload.old_id
          ? { ...item, id: action.payload.new_id, no_drag: false }
          : item
      )

    case NodeActions.DELETE_SELF:
      return state.filter((item) => item.id !== action.payload.parent_id)

    case NodeWeekActions.MOVED_TO: {
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              week: action.payload.new_parent,
              no_drag: true
            }
          : item
      )
    }

    case WeekActions.INSERT_BELOW:
      return action.payload.children
        ? [...state, ...action.payload.children.nodeweek]
        : state

    case NodeActions.INSERT_BELOW:
    case NodeActions.NEW_NODE:
      return [...state, action.payload.new_through]

    case StrategyActions.ADD_STRATEGY:
      return action.payload.nodeweeks_added.length === 0
        ? state
        : [...state, ...action.payload.nodeweeks_added]

    default:
      return state
  }
}
