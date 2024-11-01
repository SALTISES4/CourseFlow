import {
  CommonActions,
  NodeActions,
  NodeWeekActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TNodeweek } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'
interface ReplaceStoreDataAction extends AnyAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { nodeweek?: TNodeweek[] }
}

interface RefreshStoreDataAction extends AnyAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { nodeweek: TNodeweek[] }
}

interface ChangeIdNodeWeekAction extends AnyAction {
  type: NodeWeekActions.CHANGE_ID
  payload: { old_id: number; new_id: number }
}

interface MovedToNodeWeekAction extends AnyAction {
  type: NodeWeekActions.MOVED_TO
  payload: { id: number; new_parent: number }
}

interface DeleteSelfNodeAction extends AnyAction {
  type: NodeActions.DELETE_SELF
  payload: { parent_id: number }
}

interface InsertBelowNodeAction extends AnyAction {
  type: NodeActions.INSERT_BELOW
  payload: { new_through: TNodeweek }
}

interface NewNodeAction extends AnyAction {
  type: NodeActions.NEW_NODE
  payload: { new_through: TNodeweek }
}

interface InsertBelowWeekAction extends AnyAction {
  type: WeekActions.INSERT_BELOW
  payload: { children?: { nodeweek: TNodeweek[] } }
}

interface AddStrategyAction extends AnyAction {
  type: StrategyActions.ADD_STRATEGY
  payload: { nodeweeks_added: TNodeweek[] }
}

// Union type for all actions handled by the reducer
type NodeWeekActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | ChangeIdNodeWeekAction
  | MovedToNodeWeekAction
  | DeleteSelfNodeAction
  | InsertBelowNodeAction
  | NewNodeAction
  | InsertBelowWeekAction
  | AddStrategyAction

export default function nodeweekReducer(
  state: TNodeweek[] = [],
  action: NodeWeekActionTypes
): TNodeweek[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.nodeweek) {
        return action.payload.nodeweek
      }
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
          ? { ...item, id: action.payload.new_id, noDrag: false }
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
              noDrag: true
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
