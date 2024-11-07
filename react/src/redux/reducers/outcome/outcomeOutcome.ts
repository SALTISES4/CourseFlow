import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeOutcomeActions
} from '@cfRedux/types/enumActions'
import { TOutcomeOutcome } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

interface ReplaceStoreDataAction extends AnyAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { outcomeoutcome?: TOutcomeOutcome[] }
}

interface RefreshStoreDataAction extends AnyAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { outcomeoutcome: TOutcomeOutcome[] }
}

interface ChangeIdAction extends AnyAction {
  type: OutcomeOutcomeActions.CHANGE_ID
  payload: {
    oldId: number
    newId: number
  }
}

interface MovedToAction extends AnyAction {
  type: OutcomeOutcomeActions.MOVED_TO
  payload: {
    id: number
    newParent: number
  }
}

interface DeleteSelfAction extends AnyAction {
  type: OutcomeActions.DELETE_SELF
  payload: { parentId: number }
}

interface InsertChildAction extends AnyAction {
  type: OutcomeActions.INSERT_CHILD
  payload: {
    newThrough: TOutcomeOutcome
    children?: { outcomeoutcome: TOutcomeOutcome[] }
  }
}

interface InsertBelowAction extends AnyAction {
  type: OutcomeActions.INSERT_BELOW | OutcomeBaseActions.INSERT_BELOW
  payload: {
    newThrough: TOutcomeOutcome
    children?: { outcomeoutcome: TOutcomeOutcome[] }
  }
}

// Union type for all actions handled by the reducer
type OutcomeOutcomeActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | ChangeIdAction
  | MovedToAction
  | DeleteSelfAction
  | InsertChildAction
  | InsertBelowAction

function outcomeOutcomeReducer(
  state: TOutcomeOutcome[] = [],
  action: OutcomeOutcomeActionTypes
): TOutcomeOutcome[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.outcomeoutcome || state

    case CommonActions.REFRESH_STOREDATA:
      return action.payload.outcomeoutcome
        ? action.payload.outcomeoutcome.reduce(
            (acc, newItem) => {
              const existingIndex = acc.findIndex(
                (item) => item.id === newItem.id
              )
              if (existingIndex !== -1) {
                acc[existingIndex] = newItem
              } else {
                acc.push(newItem)
              }
              return acc
            },
            [...state]
          )
        : state

    case OutcomeOutcomeActions.CHANGE_ID:
      return state.map((item) =>
        item.id === action.payload.oldId
          ? { ...item, id: action.payload.newId, noDrag: false }
          : item
      )

    case OutcomeOutcomeActions.MOVED_TO:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, parent: action.payload.newParent, noDrag: true }
          : item
      )

    case OutcomeActions.DELETE_SELF:
      return state.filter((item) => item.id !== action.payload.parentId)

    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.INSERT_CHILD:
    case OutcomeActions.INSERT_BELOW:
      const newItems = action.payload.children
        ? action.payload.children.outcomeoutcome
        : []
      return [...state, action.payload.newThrough, ...newItems]

    default:
      return state
  }
  // switch (action.type) {
  //   case 'replaceStoreData': {
  //     if (action.payload.outcomeoutcome) {
  //       return action.payload.outcomeoutcome
  //     }
  //     return state
  //   }
  //
  //   case 'refreshStoreData': {
  //     const newState = state.slice()
  //     if (action.payload.outcomeoutcome) {
  //       for (var i = 0; i < action.payload.outcomeoutcome.length; i++) {
  //         const newObj = action.payload.outcomeoutcome[i]
  //         let added = false
  //         for (let j = 0; j < newState.length; j++) {
  //           if (newState[j].id == newObj.id) {
  //             newState.splice(j, 1, newObj)
  //             added = true
  //             break
  //           }
  //         }
  //         if (added) continue
  //         newState.push(newObj)
  //       }
  //     }
  //     return newState
  //   }
  //
  //   case 'outcomeoutcome/changeId': {
  //     for (var i = 0; i < state.length; i++) {
  //       if (state[i].id == action.payload.oldId) {
  //         var newState = state.slice()
  //         newState[i] = {
  //           ...newState[i],
  //           id: action.payload.newId,
  //           noDrag: false
  //         }
  //         return newState
  //       }
  //     }
  //     return state
  //   }
  //
  //   case 'outcomeoutcome/movedTo': {
  //     newState = state.slice()
  //     for (var i = 0; i < state.length; i++) {
  //       if (state[i].id == action.payload.id) {
  //         newState[i] = {
  //           ...state[i],
  //           parent: action.payload.newParent,
  //           noDrag: true
  //         }
  //       }
  //     }
  //     return newState
  //   }
  //
  //   case 'outcome/deleteSelf': {
  //     for (var i = 0; i < state.length; i++) {
  //       if (state[i].id == action.payload.parentId) {
  //         var newState = state.slice()
  //         newState.splice(i, 1)
  //         return newState
  //       }
  //     }
  //     return state
  //   }
  //
  //   case 'outcomeBase/insertBelow': {
  //     const newState = state.slice()
  //     if (action.payload.children) {
  //       for (
  //         var i = 0;
  //         i < action.payload.children.outcomeoutcome.length;
  //         i++
  //       ) {
  //         newState.push(action.payload.children.outcomeoutcome[i])
  //       }
  //     }
  //     return newState
  //   }
  //
  //   case 'outcome/insertChild':
  //   case 'outcome/insertBelow': {
  //     const newState = state.slice()
  //     newState.push(action.payload.newThrough)
  //     if (action.payload.children) {
  //       for (
  //         var i = 0;
  //         i < action.payload.children.outcomeoutcome.length;
  //         i++
  //       ) {
  //         newState.push(action.payload.children.outcomeoutcome[i])
  //       }
  //     }
  //     return newState
  //   }
  //   default:
  //     return state
  // }
}

export default outcomeOutcomeReducer
