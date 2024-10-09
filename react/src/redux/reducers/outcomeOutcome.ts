import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeOutcomeActions
} from '@cfRedux/types/enumActions'
import { TOutcomeOutcome } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

function outcomeOutcomeReducer(
  state: TOutcomeOutcome[] = [],
  action: AnyAction
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
        item.id === action.payload.old_id
          ? { ...item, id: action.payload.new_id, noDrag: false }
          : item
      )

    case OutcomeOutcomeActions.MOVED_TO:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, parent: action.payload.new_parent, noDrag: true }
          : item
      )

    case OutcomeActions.DELETE_SELF:
      return state.filter((item) => item.id !== action.payload.parent_id)

    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.INSERT_CHILD:
    case OutcomeActions.INSERT_BELOW:
      const newItems = action.payload.children
        ? action.payload.children.outcomeoutcome
        : []
      return [...state, action.payload.new_through, ...newItems]

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
  //         const new_obj = action.payload.outcomeoutcome[i]
  //         let added = false
  //         for (let j = 0; j < newState.length; j++) {
  //           if (newState[j].id == new_obj.id) {
  //             newState.splice(j, 1, new_obj)
  //             added = true
  //             break
  //           }
  //         }
  //         if (added) continue
  //         newState.push(new_obj)
  //       }
  //     }
  //     return newState
  //   }
  //
  //   case 'outcomeoutcome/changeID': {
  //     for (var i = 0; i < state.length; i++) {
  //       if (state[i].id == action.payload.old_id) {
  //         var newState = state.slice()
  //         newState[i] = {
  //           ...newState[i],
  //           id: action.payload.new_id,
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
  //           parent: action.payload.new_parent,
  //           noDrag: true
  //         }
  //       }
  //     }
  //     return newState
  //   }
  //
  //   case 'outcome/deleteSelf': {
  //     for (var i = 0; i < state.length; i++) {
  //       if (state[i].id == action.payload.parent_id) {
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
  //     newState.push(action.payload.new_through)
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
