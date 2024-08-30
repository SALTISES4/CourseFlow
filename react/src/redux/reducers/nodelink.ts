import { TNodelink } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'
import {
  CommonActions,
  NodeLinkActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { _t } from '@cf/utility/utilityFunctions'

export default function nodelinkReducer(
  state: TNodelink[] = [],
  action: AnyAction
): TNodelink[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.nodelink) return action.payload.nodelink
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

    case NodeLinkActions.CHANGE_FIELD:
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
              deleted_on: _t('This session')
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
