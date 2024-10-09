import {
  CommonActions,
  NodeActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions,
  OutcomeOutcomeActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TOutcomenode } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import { AnyAction } from '@reduxjs/toolkit'
export default function outcomeNodeReducer(
  state: TOutcomenode[] = [],
  action: AnyAction
): TOutcomenode[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA: {
      return action.payload.outcomenode || state
    }

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.outcomenode) return state

      const updatedItems = action.payload.outcomenode
        .map((newItem) => {
          const existingItem = state.find((item) => item.id === newItem.id)
          return existingItem ? newItem : null
        })
        .filter((item) => item !== null)

      const remainingItems = state.filter(
        (stateItem) =>
          !action.payload.outcomenode.some(
            (newItem) => newItem.id === stateItem.id
          )
      )

      return [...updatedItems, ...remainingItems]
    }

    case OutcomeNodeActions.UPDATE_DEGREE: {
      //Returns -1 if the outcome had already been added to the node
      if (action.payload.outcomenode === -1) {
        return state
      }

      const new_outcomenode_outcomes = action.payload.dataPackage.map(
        (outcomenode) =>
          Utility.cantorPairing(outcomenode.node, outcomenode.outcome)
      )

      const updatedState = state.map((item) => {
        const index = new_outcomenode_outcomes.indexOf(
          Utility.cantorPairing(item.node, item.outcome)
        )
        return index >= 0 ? action.payload.dataPackage[index] : item
      })

      return updatedState
        .concat(
          action.payload.dataPackage.filter(
            (item) =>
              !new_outcomenode_outcomes.includes(
                Utility.cantorPairing(item.node, item.outcome)
              )
          )
        )
        .filter((outcomenode) => outcomenode.degree > 0)
    }

    case OutcomeBaseActions.DELETE_SELF:
    case OutcomeActions.DELETE_SELF: {
      return state.filter((item) => item.outcome !== action.payload.id)
    }

    case WeekActions.INSERT_BELOW:
    case NodeActions.INSERT_BELOW:
    case OutcomeActions.INSERT_CHILD:
    case OutcomeActions.INSERT_BELOW:
    case OutcomeBaseActions.INSERT_CHILD:
    case OutcomeOutcomeActions.CHANGE_ID: {
      return action.payload.children
        ? [...state, ...action.payload.children.outcomenode]
        : state
    }

    default:
      return state
  }
}
// export default function outcomeNodeReducer(
//   state: Outcomenode[] = [],
//   action: AnyAction
// ) {
//   switch (action.type) {
//     case CommonActions.REPLACE_STOREDATA: {
//       if (action.payload.outcomenode) return action.payload.outcomenode
//       return state
//     }
//
//     case CommonActions.REFRESH_STOREDATA: {
//       const newState = state.slice()
//       if (action.payload.outcomenode) {
//         for (let i = 0; i < action.payload.outcomenode.length; i++) {
//           const new_obj = action.payload.outcomenode[i]
//           let added = false
//           for (let j = 0; j < newState.length; j++) {
//             if (newState[j].id == new_obj.id) {
//               newState.splice(j, 1, new_obj)
//               added = true
//               break
//             }
//           }
//           if (added) continue
//           newState.push(new_obj)
//         }
//       }
//       return newState
//     }
//
//     case OutcomeNodeActions.UPDATE_DEGREE: {
//       //Returns -1 if the outcome had already been added to the node
//       if (action.payload.outcomenode == -1) return state
//       const newState = state.slice()
//       const new_outcomenode_outcomes = action.payload.dataPackage.map(
//         (outcomenode) =>
//           Utility.cantorPairing(outcomenode.node, outcomenode.outcome)
//       )
//       const dataPackage_copy = action.payload.dataPackage.slice()
//       for (let i = 0; i < newState.length; i++) {
//         const new_outcomenode_index = new_outcomenode_outcomes.indexOf(
//           Utility.cantorPairing(newState[i].node, newState[i].outcome)
//         )
//         if (new_outcomenode_index >= 0) {
//           newState[i] = dataPackage_copy[new_outcomenode_index]
//           dataPackage_copy[new_outcomenode_index] = null
//         }
//       }
//       for (let i = 0; i < dataPackage_copy.length; i++) {
//         if (dataPackage_copy[i] != null) newState.push(dataPackage_copy[i])
//       }
//       return newState.filter((outcomenode) => outcomenode.degree > 0)
//     }
//
//     case OutcomeBaseActions.DELETE_SELF:
//     case OutcomeActions.DELETE_SELF: {
//       const newState = state.slice()
//       for (var i = 0; i < newState.length; i++) {
//         if (newState[i].outcome == action.payload.id) {
//           newState.splice(i, 1)
//           i--
//         }
//       }
//       return newState
//     }
//
//     case WeekActions.INSERT_BELOW:
//     case NodeActions.INSERT_BELOW:
//     case OutcomeActions.INSERT_CHILD:
//     case OutcomeActions.INSERT_BELOW:
//     case OutcomeBaseActions.INSERT_CHILD:
//     case OutcomeOutcomeActions.CHANGE_ID: {
//       if (!action.payload.children) {
//         return state
//       }
//       const newState = state.slice()
//       for (var i = 0; i < action.payload.children.outcomenode.length; i++) {
//         newState.push(action.payload.children.outcomenode[i])
//       }
//       return newState
//     }
//
//     default:
//       return state
//   }
// }
