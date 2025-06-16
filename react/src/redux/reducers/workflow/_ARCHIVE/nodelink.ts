import { CfLock } from '@cf/types/common'
import { _t } from '@cf/utility/Utility.class'
import {
  CommonActions,
  NodelinkActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TNodelink } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

interface GenericNodelinkAction extends AnyAction {
  type: CommonActions.REPLACE_STOREDATA | CommonActions.REFRESH_STOREDATA
  payload: { nodelink?: TNodelink[] }
}

interface CreateLockAction extends AnyAction {
  type: NodelinkActions.CREATE_LOCK
  payload: { id: number; lock: CfLock }
}

interface ChangeFieldAction extends AnyAction {
  type: NodelinkActions.CHANGE_FIELD
  payload: { id: number; json: any }
}

interface NewNodelinkAction extends AnyAction {
  type: NodelinkActions.NEW_NODE_LINK
  payload: { newModel: TNodelink }
}

interface NodelinkByIdAction extends AnyAction {
  type:
    | NodelinkActions.DELETE_SELF
    | NodelinkActions.DELETE_SELF_SOFT
    | NodelinkActions.RESTORE_SELF
  payload: { id: number }
}

interface InsertBelowWeekAction extends AnyAction {
  type: WeekActions.INSERT_BELOW
  payload: { children?: { nodelink: TNodelink[] } }
}

interface AddStrategyAction extends AnyAction {
  type: StrategyActions.ADD_STRATEGY
  payload: { nodelinksAdded: TNodelink[] }
}

type NodelinkActionTypes =
  | GenericNodelinkAction
  | NodelinkByIdAction
  | CreateLockAction
  | ChangeFieldAction
  | NewNodelinkAction
  | InsertBelowWeekAction
  | AddStrategyAction

export default function nodelinkReducer(
  state: TNodelink[] = [],
  action: NodelinkActionTypes
): TNodelink[] {
  switch (action.type) {
    // case CommonActions.REPLACE_STOREDATA:
    //   if (action.payload.nodelink) {
    //     return action.payload.nodelink
    //   }
    //   return state

    // case CommonActions.REFRESH_STOREDATA:
    //   return action.payload.nodelink
    //     ? action.payload.nodelink.reduce(
    //         (updatedState, newNodelink) => {
    //           const index = updatedState.findIndex(
    //             (item) => item.id === newNodelink.id
    //           )
    //           return index !== -1
    //             ? [
    //                 ...updatedState.slice(0, index),
    //                 newNodelink,
    //                 ...updatedState.slice(index + 1)
    //               ]
    //             : [...updatedState, newNodelink]
    //         },
    //         [...state]
    //       )
    //     : state

    // case NodelinkActions.CREATE_LOCK:
    //   return state.map((item) =>
    //     item.id === action.payload.id
    //       ? { ...item, lock: action.payload.lock }
    //       : item
    //   )

    // case NodelinkActions.CHANGE_FIELD:
    //   return state.map((item) =>
    //     item.id === action.payload.id
    //       ? { ...item, ...action.payload.json }
    //       : item
    //   )

    // case NodelinkActions.NEW_NODE_LINK:
    //   return [...state, action.payload.newModel]

    // case NodelinkActions.DELETE_SELF:
    //   return state.filter((item) => item.id !== action.payload.id)

    // case NodelinkActions.DELETE_SELF_SOFT:
    //   return state.map((item) =>
    //     item.id === action.payload.id
    //       ? {
    //           ...item,
    //           deleted: true,
    //           deletedOn: _t('This session')
    //         }
    //       : item
    //   )

    // case NodelinkActions.RESTORE_SELF:
    //   return state.map((item) =>
    //     item.id === action.payload.id ? { ...item, deleted: false } : item
    //   )

    case WeekActions.INSERT_BELOW:
      return action.payload.children
        ? [...state, ...action.payload.children.nodelink]
        : state

    case StrategyActions.ADD_STRATEGY:
      return action.payload.nodelinksAdded.length === 0
        ? state
        : [...state, ...action.payload.nodelinksAdded]

    default:
      return state
  }
}
