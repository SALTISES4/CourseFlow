import {
  CommonActions,
  NodeActions,
  NodeSectionActions,
  SectionActions,
  StrategyActions
} from '@cfRedux/types/enumActions'
import { TNodesection } from '@cfRedux/types/type'
import { UnknownAction } from '@reduxjs/toolkit'

interface ReplaceStoreDataAction extends UnknownAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { nodesection?: TNodesection[] }
}

interface RefreshStoreDataAction extends UnknownAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { nodesection: TNodesection[] }
}

interface ChangeIdNodeSectionAction extends UnknownAction {
  type: NodeSectionActions.CHANGE_ID
  payload: { olduuid: string; newuuid: string }
}

interface MovedToNodeSectionAction extends UnknownAction {
  type: NodeSectionActions.MOVED_TO
  payload: { uuid: string; newParent: number }
}

interface DeleteSelfNodeAction extends UnknownAction {
  type: NodeActions.DELETE_SELF
  payload: { parentuuid: string }
}

interface InsertBelowNodeAction extends UnknownAction {
  type: NodeActions.INSERT_BELOW
  payload: { newThrough: TNodesection }
}

interface NewNodeAction extends UnknownAction {
  type: NodeActions.NEW_NODE
  payload: { newThrough: TNodesection }
}

interface InsertBelowSectionAction extends UnknownAction {
  type: SectionActions.INSERT_BELOW
  payload: { children?: { nodesection: TNodesection[] } }
}

interface AddStrategyAction extends UnknownAction {
  type: StrategyActions.ADD_STRATEGY
  payload: { nodesectionsAdded: TNodesection[] }
}

// Union type for all actions handled by the reducer
type NodeSectionActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | ChangeIdNodeSectionAction
  | MovedToNodeSectionAction
  | DeleteSelfNodeAction
  | InsertBelowNodeAction
  | NewNodeAction
  | InsertBelowSectionAction
  | AddStrategyAction

export default function nodesectionReducer(
  state: TNodesection[] = [],
  action: NodeSectionActionTypes
): TNodesection[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.nodesection) {
        return action.payload.nodesection
      }
      return state

    case CommonActions.REFRESH_STOREDATA:
      return action.payload.nodesection
        ? action.payload.nodesection.reduce(
            (updatedState, newNodeSection) => {
              const index = updatedState.findIndex(
                (item) => item.uuid === newNodeSection.uuid
              )
              if (index !== -1) {
                updatedState.splice(index, 1, newNodeSection)
              } else {
                updatedState.push(newNodeSection)
              }
              return updatedState
            },
            [...state]
          )
        : state

    case NodeSectionActions.CHANGE_ID:
      return state.map((item) =>
        item.uuid === action.payload.oldId
          ? { ...item, uuid: action.payload.newId, noDrag: false }
          : item
      )

    case NodeActions.DELETE_SELF:
      return state.filter((item) => item.uuid !== action.payload.parentId)

    case NodeSectionActions.MOVED_TO: {
      return state.map((item) =>
        item.uuid === action.payload.uuid
          ? {
              ...item,
              section: action.payload.newParent,
              noDrag: true
            }
          : item
      )
    }

    case SectionActions.INSERT_BELOW:
      return action.payload.children
        ? [...state, ...action.payload.children.nodesection]
        : state

    case NodeActions.INSERT_BELOW:
    case NodeActions.NEW_NODE:
      return [...state, action.payload.newThrough]

    case StrategyActions.ADD_STRATEGY:
      return action.payload.nodesectionsAdded.length === 0
        ? state
        : [...state, ...action.payload.nodesectionsAdded]

    default:
      return state
  }
}
