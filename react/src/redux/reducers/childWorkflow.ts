import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions
} from '@cfRedux/types/enumActions'
import { AnyAction } from '@reduxjs/toolkit'

function childWorkflowReducer(state = [], action: AnyAction) {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.child_workflow || state

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.child_workflow) {
        return state
      }

      return action.payload.child_workflow.reduce(
        (updatedState, newChildWorkflowItem) => {
          const existingIndex = updatedState.findIndex(
            (item) => item.id === newChildWorkflowItem.id
          )

          if (existingIndex !== -1) {
            // Update existing item in place
            updatedState[existingIndex] = newChildWorkflowItem
          } else {
            // Add new item to the array
            updatedState.push(newChildWorkflowItem)
          }

          return updatedState
        },
        [...state]
      )
    }

    case OutcomeBaseActions.DELETE_SELF:
    case OutcomeBaseActions.DELETE_SELF_SOFT: {
      return state.map((item) => ({
        ...item,
        outcomeworkflow_set: item.outcomeworkflow_set.filter(
          (id) => id !== action.payload.parent_id
        )
      }))
    }

    case OutcomeBaseActions.RESTORE_SELF:
    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.NEW_OUTCOME:
      return state.map((item) => {
        if (
          item.id === action.payload.parent_id ||
          item.id === action.payload.new_through.workflow
        ) {
          const new_outcomeworkflow_set = [...item.outcomeworkflow_set]
          const index =
            action.type === OutcomeBaseActions.RESTORE_SELF
              ? action.payload.throughparent_index
              : action.payload.new_through.rank

          new_outcomeworkflow_set.splice(
            index,
            0,
            action.payload.throughparent_id || action.payload.new_through.id
          )
          return { ...item, outcomeworkflow_set: new_outcomeworkflow_set }
        }
        return item
      })

    default:
      return state
  }
}

export default childWorkflowReducer

// function childWorkflowReducer(state = [], action: AnyAction) {
//   switch (action.type) {
//     case CommonActions.REPLACE_STOREDATA: {
//       if (action.payload.child_workflow) {
//         return action.payload.child_workflow
//       }
//       return state
//     }
//
//     case CommonActions.REFRESH_STOREDATA: {
//       const newState = [...state] // Use spread operator for cloning arrays
//
//       if (action.payload.child_workflow) {
//         action.payload.child_workflow.forEach((newObj) => {
//           const existingIndex = newState.findIndex(
//             (item) => item.id === newObj.id
//           )
//
//           if (existingIndex !== -1) {
//             newState[existingIndex] = newObj // Directly replace the object at the found index
//           } else {
//             newState.push(newObj) // If not found, push the new object
//           }
//         })
//       }
//
//       return newState
//     }
//
//     case OutcomeBaseActions.DELETE_SELF:
//     case OutcomeBaseActions.DELETE_SELF_SOFT: {
//       // Find index of the state item that contains the parent_id in its outcomeworkflow_set
//       const index = state.findIndex((item) =>
//         item.outcomeworkflow_set.includes(action.payload.parent_id)
//       )
//
//       // If found, create a new state with the modified item
//       if (index >= 0) {
//         return state.map((item, idx) =>
//           idx === index
//             ? {
//                 ...item,
//                 outcomeworkflow_set: item.outcomeworkflow_set.filter(
//                   (id) => id !== action.payload.parent_id
//                 )
//               }
//             : item
//         )
//       }
//
//       return state // Return original state if no changes
//     }
//
//     case OutcomeBaseActions.RESTORE_SELF: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parent_id) {
//           var new_state = state.slice()
//           new_state[i] = { ...state[i] }
//           new_state[i].outcomeworkflow_set =
//             state[i].outcomeworkflow_set.slice()
//           new_state[i].outcomeworkflow_set.splice(
//             action.payload.throughparent_index,
//             0,
//             action.payload.throughparent_id
//           )
//           return new_state
//         }
//       }
//       return state
//     }
//
//     case OutcomeBaseActions.INSERT_BELOW:
//     case OutcomeActions.NEW_OUTCOME: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.new_through.workflow) {
//           var new_state = state.slice()
//           new_state[i] = { ...state[i] }
//           const new_outcomeworkflow_set = state[i].outcomeworkflow_set.slice()
//           new_outcomeworkflow_set.splice(
//             action.payload.new_through.rank,
//             0,
//             action.payload.new_through.id
//           )
//           new_state[i].outcomeworkflow_set = new_outcomeworkflow_set
//           return new_state
//         }
//       }
//       return state
//     }
//
//     default:
//       return state
//   }
// }
//
// export default childWorkflowReducer
