import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeWorkflowActions
} from '@cfRedux/enumActions'
import { Columnworkflow } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'

function outcomeworkflowReducer(
  state: Columnworkflow[] = [],
  action: AnyAction
): Columnworkflow[] {
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
        item.id === action.payload.id ? { ...item, no_drag: true } : item
      )

    case OutcomeWorkflowActions.CHANGE_ID:
      return state.map((item) =>
        item.id === action.payload.old_id
          ? { ...item, id: action.payload.new_id, no_drag: false }
          : item
      )

    case OutcomeBaseActions.DELETE_SELF:
      return state.filter((item) => item.outcome !== action.payload.id)

    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.NEW_OUTCOME:
      return [...state, action.payload.new_through]

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
//       const new_state = state.slice()
//       if (action.payload.outcomeworkflow) {
//         for (let i = 0; i < action.payload.outcomeworkflow.length; i++) {
//           const new_obj = action.payload.outcomeworkflow[i]
//           let added = false
//           for (let j = 0; j < new_state.length; j++) {
//             if (new_state[j].id === new_obj.id) {
//               new_state.splice(j, 1, new_obj)
//               added = true
//               break
//             }
//           }
//           if (added) continue
//           new_state.push(new_obj)
//         }
//       }
//       return new_state
//     }
//
//     case OutcomeWorkflowActions.MOVED_TO: {
//       const new_state = state.slice()
//       for (let i = 0; i < state.length; i++) {
//         if (state[i].id === action.payload.id) {
//           new_state[i] = {
//             ...state[i],
//             no_drag: true
//           }
//         }
//       }
//       return new_state
//     }
//
//     case OutcomeWorkflowActions.CHANGE_ID: {
//       for (let i = 0; i < state.length; i++) {
//         if (state[i].id === action.payload.old_id) {
//           const new_state = state.slice()
//           new_state[i] = {
//             ...new_state[i],
//             id: action.payload.new_id,
//             no_drag: false
//           }
//           return new_state
//         }
//       }
//       return state
//     }
//
//     case OutcomeBaseActions.DELETE_SELF: {
//       for (let i = 0; i < state.length; i++) {
//         if (state[i].outcome == action.payload.id) {
//           const new_state = state.slice()
//           new_state.splice(i, 1)
//           return new_state
//         }
//       }
//       return state
//     }
//
//     case OutcomeBaseActions.INSERT_BELOW: {
//       const new_state = state.slice()
//       new_state.push(action.payload.new_through)
//       return new_state
//     }
//
//     case OutcomeActions.NEW_OUTCOME: {
//       const new_state = state.slice()
//       new_state.push(action.payload.new_through)
//       return new_state
//     }
//
//     default:
//       return state
//   }
// }
