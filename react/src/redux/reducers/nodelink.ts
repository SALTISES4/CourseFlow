import { _t } from '@cf/utility/utilityFunctions'
import {
  CommonActions,
  NodeLinkActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TNodelink } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'
interface ReplaceStoreDataAction extends AnyAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { nodelink?: TNodelink[] }
}

interface RefreshStoreDataAction extends AnyAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { nodelink: TNodelink[] }
}

interface CreateLockAction extends AnyAction {
  type: NodeLinkActions.CREATE_LOCK
  payload: { id: number; lock: boolean }
}

interface ChangeFieldAction extends AnyAction {
  type: NodeLinkActions.CHANGE_FIELD
  payload: { id: number; json: any; changeFieldID?: number }
}

interface NewNodeLinkAction extends AnyAction {
  type: NodeLinkActions.NEW_NODE_LINK
  payload: { new_model: TNodelink }
}

interface DeleteSelfAction extends AnyAction {
  type: NodeLinkActions.DELETE_SELF
  payload: { id: number }
}

interface DeleteSelfSoftAction extends AnyAction {
  type: NodeLinkActions.DELETE_SELF_SOFT
  payload: { id: number }
}

interface RestoreSelfAction extends AnyAction {
  type: NodeLinkActions.RESTORE_SELF
  payload: { id: number }
}

interface InsertBelowWeekAction extends AnyAction {
  type: WeekActions.INSERT_BELOW
  payload: { children?: { nodelink: TNodelink[] } }
}

interface AddStrategyAction extends AnyAction {
  type: StrategyActions.ADD_STRATEGY
  payload: { nodelinks_added: TNodelink[] }
}

type NodelinkActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | CreateLockAction
  | ChangeFieldAction
  | NewNodeLinkAction
  | DeleteSelfAction
  | DeleteSelfSoftAction
  | RestoreSelfAction
  | InsertBelowWeekAction
  | AddStrategyAction

export default function nodelinkReducer(
  state: TNodelink[] = [],
  action: NodelinkActionTypes
): TNodelink[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.nodelink) {
        return action.payload.nodelink
      }
      return state

    case CommonActions.REFRESH_STOREDATA:
      return action.payload.nodelink
        ? action.payload.nodelink.reduce(
            (updatedState, newNodelink) => {
              const index = updatedState.findIndex(
                (item) => item.id === newNodelink.id
              )
              return index !== -1
                ? [
                    ...updatedState.slice(0, index),
                    newNodelink,
                    ...updatedState.slice(index + 1)
                  ]
                : [...updatedState, newNodelink]
            },
            [...state]
          )
        : state

    case NodeLinkActions.CREATE_LOCK:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, lock: action.payload.lock }
          : item
      )

    case NodeLinkActions.changeField:
      if (
        action.payload.changeFieldID ===
        //@ts-ignore
        COURSEFLOW_APP.contextData.changeFieldID
      ) {
        return state
      }
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.json }
          : item
      )

    case NodeLinkActions.NEW_NODE_LINK:
      return [...state, action.payload.new_model]

    case NodeLinkActions.DELETE_SELF:
      return state.filter((item) => item.id !== action.payload.id)

    case NodeLinkActions.DELETE_SELF_SOFT:
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              deleted: true,
              deletedOn: _t('This session')
            }
          : item
      )

    case NodeLinkActions.RESTORE_SELF:
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, deleted: false } : item
      )

    case WeekActions.INSERT_BELOW:
      return action.payload.children
        ? [...state, ...action.payload.children.nodelink]
        : state

    case StrategyActions.ADD_STRATEGY:
      return action.payload.nodelinks_added.length === 0
        ? state
        : [...state, ...action.payload.nodelinks_added]

    default:
      return state
  }
}
