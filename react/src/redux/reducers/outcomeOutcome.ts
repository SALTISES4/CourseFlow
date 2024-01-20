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
          ? { ...item, id: action.payload.new_id, no_drag: false }
          : item
      )

    case OutcomeOutcomeActions.MOVED_TO:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, parent: action.payload.new_parent, no_drag: true }
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
  //     const new_state = state.slice()
  //     if (action.payload.outcomeoutcome) {
  //       for (var i = 0; i < action.payload.outcomeoutcome.length; i++) {
  //         const new_obj = action.payload.outcomeoutcome[i]
  //         let added = false
  //         for (let j = 0; j < new_state.length; j++) {
  //           if (new_state[j].id == new_obj.id) {
  //             new_state.splice(j, 1, new_obj)
  //             added = true
  //             break
  //           }
  //         }
  //         if (added) continue
  //         new_state.push(new_obj)
  //       }
  //     }
  //     return new_state
  //   }
  //
  //   case 'outcomeoutcome/changeID': {
  //     for (var i = 0; i < state.length; i++) {
  //       if (state[i].id == action.payload.old_id) {
  //         var new_state = state.slice()
  //         new_state[i] = {
  //           ...new_state[i],
  //           id: action.payload.new_id,
  //           no_drag: false
  //         }
  //         return new_state
  //       }
  //     }
  //     return state
  //   }
  //
  //   case 'outcomeoutcome/movedTo': {
  //     new_state = state.slice()
  //     for (var i = 0; i < state.length; i++) {
  //       if (state[i].id == action.payload.id) {
  //         new_state[i] = {
  //           ...state[i],
  //           parent: action.payload.new_parent,
  //           no_drag: true
  //         }
  //       }
  //     }
  //     return new_state
  //   }
  //
  //   case 'outcome/deleteSelf': {
  //     for (var i = 0; i < state.length; i++) {
  //       if (state[i].id == action.payload.parent_id) {
  //         var new_state = state.slice()
  //         new_state.splice(i, 1)
  //         return new_state
  //       }
  //     }
  //     return state
  //   }
  //
  //   case 'outcome_base/insertBelow': {
  //     const new_state = state.slice()
  //     if (action.payload.children) {
  //       for (
  //         var i = 0;
  //         i < action.payload.children.outcomeoutcome.length;
  //         i++
  //       ) {
  //         new_state.push(action.payload.children.outcomeoutcome[i])
  //       }
  //     }
  //     return new_state
  //   }
  //
  //   case 'outcome/insertChild':
  //   case 'outcome/insertBelow': {
  //     const new_state = state.slice()
  //     new_state.push(action.payload.new_through)
  //     if (action.payload.children) {
  //       for (
  //         var i = 0;
  //         i < action.payload.children.outcomeoutcome.length;
  //         i++
  //       ) {
  //         new_state.push(action.payload.children.outcomeoutcome[i])
  //       }
  //     }
  //     return new_state
  //   }
  //   default:
  //     return state
  // }
}

export default outcomeOutcomeReducer
