import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions
} from '@cfRedux/types/enumActions'
import { TChildWorkflow } from '@cfRedux/types/type'
import { UnknownAction } from '@reduxjs/toolkit'

interface ReplaceStoreDataAction extends UnknownAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { childWorkflow?: TChildWorkflow[] }
}

interface RefreshStoreDataAction extends UnknownAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { childWorkflow: TChildWorkflow[] }
}

interface DeleteSelfOutcomeBaseAction extends UnknownAction {
  type: OutcomeBaseActions.DELETE_SELF | OutcomeBaseActions.DELETE_SELF_SOFT
  payload: { parentid: string }
}

interface RestoreSelfOutcomeBaseAction extends UnknownAction {
  type: OutcomeBaseActions.RESTORE_SELF
  payload: {
    parentid: string
    throughparentIndex: number
    throughparentid: string
  }
}

interface InsertBelowOutcomeBaseAction extends UnknownAction {
  type: OutcomeBaseActions.INSERT_BELOW
  payload: {
    parentid: string
    newThrough: {
      id: string
      workflow: number
      rank: number
    }
  }
}

interface NewOutcomeAction extends UnknownAction {
  type: OutcomeActions.NEW_OUTCOME
  payload: {
    parentid: string
    newThrough: {
      id: string
      workflow: number
    }
  }
}

type ChildWorkflowActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | DeleteSelfOutcomeBaseAction
  | RestoreSelfOutcomeBaseAction
  | InsertBelowOutcomeBaseAction
  | NewOutcomeAction

function childWorkflowReducer(state = [], action: ChildWorkflowActionTypes) {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.childWorkflow || state

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.childWorkflow) {
        return state
      }

      return action.payload.childWorkflow.reduce(
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
        outcomeworkflowSet: item.outcomeworkflowSet.filter(
          (id) => id !== action.payload.parentId
        )
      }))
    }

    // case OutcomeBaseActions.RESTORE_SELF:
    //   return state.map((item) => {
    //     if (item.id === action.payload.parentId) {
    //       const newOutcomeworkflowSet = [...item.outcomeworkflowSet]
    //       const index =
    //         action.type === OutcomeBaseActions.RESTORE_SELF
    //           ? action.payload.throughparentIndex
    //           : action.payload.newThrough.rank
    //
    //       newOutcomeworkflowSet.splice(
    //         index,
    //         0,
    //         action.payload.throughparentId || action.payload.newThrough.id
    //       )
    //       return { ...item, outcomeworkflowSet: newOutcomeworkflowSet }
    //     }
    //     return item
    //   })

    // @todo untangle this
    case OutcomeBaseActions.RESTORE_SELF:
    case OutcomeBaseActions.INSERT_BELOW:
    case OutcomeActions.NEW_OUTCOME:
      return state.map((item) => {
        if (
          item.id === action.payload.parentId ||
          item.id === action.payload.newThrough.workflow
        ) {
          const newOutcomeworkflowSet = [...item.outcomeworkflowSet]
          const index =
            action.type === OutcomeBaseActions.RESTORE_SELF
              ? action.payload.throughparentIndex
              : action.payload.newThrough.rank

          newOutcomeworkflowSet.splice(
            index,
            0,
            action.payload.throughparentId || action.payload.newThrough.id
          )
          return { ...item, outcomeworkflowSet: newOutcomeworkflowSet }
        }
        return item
      })

    default:
      return state
  }
}

export default childWorkflowReducer

// function childWorkflowReducer(state = [], action: UnknownAction) {
//   switch (action.type) {
//     case CommonActions.REPLACE_STOREDATA: {
//       if (action.payload.childWorkflow) {
//         return action.payload.childWorkflow
//       }
//       return state
//     }
//
//     case CommonActions.REFRESH_STOREDATA: {
//       const newState = [...state] // Use spread operator for cloning arrays
//
//       if (action.payload.childWorkflow) {
//         action.payload.childWorkflow.forEach((newObj) => {
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
//       // Find index of the state item that contains the parentId in its outcomeworkflowSet
//       const index = state.findIndex((item) =>
//         item.outcomeworkflowSet.includes(action.payload.parentId)
//       )
//
//       // If found, create a new state with the modified item
//       if (index >= 0) {
//         return state.map((item, idx) =>
//           idx === index
//             ? {
//                 ...item,
//                 outcomeworkflowSet: item.outcomeworkflowSet.filter(
//                   (id) => id !== action.payload.parentId
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
//         if (state[i].id == action.payload.parentId) {
//           var newState = state.slice()
//           newState[i] = { ...state[i] }
//           newState[i].outcomeworkflowSet =
//             state[i].outcomeworkflowSet.slice()
//           newState[i].outcomeworkflowSet.splice(
//             action.payload.throughparentIndex,
//             0,
//             action.payload.throughparentId
//           )
//           return newState
//         }
//       }
//       return state
//     }
//
//     case OutcomeBaseActions.INSERT_BELOW:
//     case OutcomeActions.NEW_OUTCOME: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.newThrough.workflow) {
//           var newState = state.slice()
//           newState[i] = { ...state[i] }
//           const newOutcomeworkflowSet = state[i].outcomeworkflowSet.slice()
//           newOutcomeworkflowSet.splice(
//             action.payload.newThrough.rank,
//             0,
//             action.payload.newThrough.id
//           )
//           newState[i].outcomeworkflowSet = newOutcomeworkflowSet
//           return newState
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
