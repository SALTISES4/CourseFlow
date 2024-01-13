import * as Utility from '@cfUtility'
import {
  CommonActions,
  NodeActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions,
  OutcomeOutcomeActions,
  WeekActions
} from '@cfRedux/enumActions'
import { Outcomenode } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'
export default function outcomeNodeReducer(
  state: Outcomenode[] = [],
  action: AnyAction
): Outcomenode[] {
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

      const new_outcomenode_outcomes = action.payload.data_package.map(
        (outcomenode) =>
          Utility.cantorPairing(outcomenode.node, outcomenode.outcome)
      )

      const updatedState = state.map((item) => {
        const index = new_outcomenode_outcomes.indexOf(
          Utility.cantorPairing(item.node, item.outcome)
        )
        return index >= 0 ? action.payload.data_package[index] : item
      })

      return updatedState
        .concat(
          action.payload.data_package.filter(
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
//       const new_state = state.slice()
//       if (action.payload.outcomenode) {
//         for (let i = 0; i < action.payload.outcomenode.length; i++) {
//           const new_obj = action.payload.outcomenode[i]
//           let added = false
//           for (let j = 0; j < new_state.length; j++) {
//             if (new_state[j].id == new_obj.id) {
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
//     case OutcomeNodeActions.UPDATE_DEGREE: {
//       //Returns -1 if the outcome had already been added to the node
//       if (action.payload.outcomenode == -1) return state
//       const new_state = state.slice()
//       const new_outcomenode_outcomes = action.payload.data_package.map(
//         (outcomenode) =>
//           Utility.cantorPairing(outcomenode.node, outcomenode.outcome)
//       )
//       const data_package_copy = action.payload.data_package.slice()
//       for (let i = 0; i < new_state.length; i++) {
//         const new_outcomenode_index = new_outcomenode_outcomes.indexOf(
//           Utility.cantorPairing(new_state[i].node, new_state[i].outcome)
//         )
//         if (new_outcomenode_index >= 0) {
//           new_state[i] = data_package_copy[new_outcomenode_index]
//           data_package_copy[new_outcomenode_index] = null
//         }
//       }
//       for (let i = 0; i < data_package_copy.length; i++) {
//         if (data_package_copy[i] != null) new_state.push(data_package_copy[i])
//       }
//       return new_state.filter((outcomenode) => outcomenode.degree > 0)
//     }
//
//     case OutcomeBaseActions.DELETE_SELF:
//     case OutcomeActions.DELETE_SELF: {
//       const new_state = state.slice()
//       for (var i = 0; i < new_state.length; i++) {
//         if (new_state[i].outcome == action.payload.id) {
//           new_state.splice(i, 1)
//           i--
//         }
//       }
//       return new_state
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
//       const new_state = state.slice()
//       for (var i = 0; i < action.payload.children.outcomenode.length; i++) {
//         new_state.push(action.payload.children.outcomenode[i])
//       }
//       return new_state
//     }
//
//     default:
//       return state
//   }
// }
