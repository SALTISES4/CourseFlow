import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeWorkflowActions
} from '@cfRedux/types/enumActions'
import { TColumnworkflow } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

function outcomeworkflowReducer(
  state: TColumnworkflow[] = [],
  action: AnyAction
): TColumnworkflow[] {
  switch (action.type) {
    case CommonActions.REFRESH_STOREDATA: {
      // Check if 'outcomeworkflow' is available in the payload
      if (!action.payload.outcomeworkflow) {
        return state
      }

      // Using a more descriptive function for reducing the array
      // Cloning state to avoid direct mutation
      return action.payload.outcomeworkflow.reduce(
        (accumulator, currentItem) => {
          const existingItemIndex = accumulator.findIndex(
            (item) => item.id === currentItem.id
          )

          if (existingItemIndex !== -1) {
            // Replace existing item if found
            accumulator[existingItemIndex] = currentItem
          } else {
            // Add new item if not found
            accumulator.push(currentItem)
          }

          return accumulator
        },
        [...state]
      )
    }

    case OutcomeWorkflowActions.MOVED_TO:
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, noDrag: true } : item
      )

    case OutcomeWorkflowActions.CHANGE_ID:
      return state.map((item) =>
        item.id === action.payload.oldId
          ? { ...item, id: action.payload.newId, noDrag: false }
          : item
      )

    case OutcomeBaseActions.DELETE_SELF:
      return state.filter((item) => item.outcome !== action.payload.id)

    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.NEW_OUTCOME:
      return [...state, action.payload.newThrough]

    default:
      return state
  }
}

export default outcomeworkflowReducer

// export default function outcomeworkflowReducer(
//   state: Columnworkflow[] = [],
//   action: AnyAction
// ): Columnworkflow[] {
//   switch (action.type) {
//     case CommonActions.REPLACE_STOREDATA:
//       if (action.payload.outcomeworkflow) {
//         return action.payload.outcomeworkflow
//       }
//       return state
//
//     case CommonActions.REFRESH_STOREDATA: {
//       const newState = state.slice()
//       if (action.payload.outcomeworkflow) {
//         for (let i = 0; i < action.payload.outcomeworkflow.length; i++) {
//           const newObj = action.payload.outcomeworkflow[i]
//           let added = false
//           for (let j = 0; j < newState.length; j++) {
//             if (newState[j].id === newObj.id) {
//               newState.splice(j, 1, newObj)
//               added = true
//               break
//             }
//           }
//           if (added) continue
//           newState.push(newObj)
//         }
//       }
//       return newState
//     }
//
//     case OutcomeWorkflowActions.MOVED_TO: {
//       const newState = state.slice()
//       for (let i = 0; i < state.length; i++) {
//         if (state[i].id === action.payload.id) {
//           newState[i] = {
//             ...state[i],
//             noDrag: true
//           }
//         }
//       }
//       return newState
//     }
//
//     case OutcomeWorkflowActions.CHANGE_ID: {
//       for (let i = 0; i < state.length; i++) {
//         if (state[i].id === action.payload.oldId) {
//           const newState = state.slice()
//           newState[i] = {
//             ...newState[i],
//             id: action.payload.newId,
//             noDrag: false
//           }
//           return newState
//         }
//       }
//       return state
//     }
//
//     case OutcomeBaseActions.DELETE_SELF: {
//       for (let i = 0; i < state.length; i++) {
//         if (state[i].outcome == action.payload.id) {
//           const newState = state.slice()
//           newState.splice(i, 1)
//           return newState
//         }
//       }
//       return state
//     }
//
//     case OutcomeBaseActions.INSERT_BELOW: {
//       const newState = state.slice()
//       newState.push(action.payload.newThrough)
//       return newState
//     }
//
//     case OutcomeActions.NEW_OUTCOME: {
//       const newState = state.slice()
//       newState.push(action.payload.newThrough)
//       return newState
//     }
//
//     default:
//       return state
//   }
// }
