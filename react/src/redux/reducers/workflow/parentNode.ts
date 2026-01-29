import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions
} from '@cfRedux/types/enumActions'
import { TParentNode } from '@cfRedux/types/type'
import { UnknownAction } from '@reduxjs/toolkit'
interface ReplaceStoreDataAction extends UnknownAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { parentNode?: TParentNode[] }
}

interface RefreshStoreDataAction extends UnknownAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { parentNode: TParentNode[] }
}

interface UpdateDegreeAction extends UnknownAction {
  type: OutcomeNodeActions.UPDATE_DEGREE
  payload: {
    outcomenode: number
    dataPackage: any[]
  }
}

interface DeleteSelfAction extends UnknownAction {
  type: OutcomeActions.DELETE_SELF | OutcomeBaseActions.DELETE_SELF
  payload: { extraData: any[] } // Specify
}

interface DeleteSelfSoftAction extends UnknownAction {
  type: OutcomeActions.DELETE_SELF_SOFT | OutcomeBaseActions.DELETE_SELF_SOFT
  payload: { extraData: any[] }
}

interface RestoreSelfAction extends UnknownAction {
  type: OutcomeActions.RESTORE_SELF | OutcomeBaseActions.RESTORE_SELF
  payload: { extraData: any[] }
}

// Union type for all actions handled by the reducer
type ParentNodeActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | UpdateDegreeAction
  | DeleteSelfAction
  | DeleteSelfSoftAction
  | RestoreSelfAction

export default function parentNodeReducer(
  state = [],
  action: ParentNodeActionTypes
) {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.parentNode || state

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.parentNode) {
        return state
      }

      return action.payload.parentNode.reduce(
        (acc, newItem) => {
          const index = acc.findIndex((item) => item.id === newItem.id)
          if (index > -1) {
            acc.splice(index, 1, newItem)
          } else {
            acc.push(newItem)
          }
          return acc
        },
        [...state]
      )
    }

    /*******************************************************
     * OUTCOME NODE
     *******************************************************/
    /*
     * called dynamically as response to WS message event
     * */
    case OutcomeNodeActions.UPDATE_DEGREE: {
      if (action.payload.outcomenode === -1) {
        return state
      }

      return state.map((item) => {
        if (item.id === action.payload.dataPackage[0].node) {
          return {
            ...item,
            outcomenodeSet: action.payload.newOutcomenodeSet,
            outcomenodeUniqueSet: action.payload.newOutcomenodeUniqueSet
          }
        }

        return item
      })
    }

    /*******************************************************
     * OUTCOME
     *******************************************************/
    case OutcomeActions.DELETE_SELF:
    case OutcomeActions.DELETE_SELF_SOFT:
    case OutcomeActions.RESTORE_SELF:
    case OutcomeBaseActions.RESTORE_SELF:
    case OutcomeBaseActions.DELETE_SELF:
    case OutcomeBaseActions.DELETE_SELF_SOFT: {
      return state.map((item, index) =>
        action.payload.extraData.find((data) => data.id === item.id)
          ? {
              ...item,
              ...action.payload.extraData.find((data) => data.id === item.id)
            }
          : item
      )
    }

    default:
      return state
  }
}

// export default function parentNodeReducer(state = [], action) {
//   switch (action.type) {
//     case 'replaceStoreData':
//       if (action.payload.parentNode) return action.payload.parentNode
//       return state
//     case 'refreshStoreData':
//       var newState = state.slice()
//       if (action.payload.parentNode) {
//         for (var i = 0; i < action.payload.parentNode.length; i++) {
//           const newObj = action.payload.parentNode[i]
//           let added = false
//           for (var j = 0; j < newState.length; j++) {
//             if (newState[j].id == newObj.id) {
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
//     case 'outcomenode/updateDegree':
//       //Returns -1 if the outcome had already been added to the node at the given degree
//       if (action.payload.outcomenode == -1) return state
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.dataPackage[0].node) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i] }
//           newState[i].outcomenodeSet = action.payload.newOutcomenodeSet
//           newState[i].outcomenodeUniqueSet =
//             action.payload.newOutcomenodeUniqueSet
//           return newState
//         }
//       }
//       return state
//     case 'outcome/deleteSelf':
//     case 'outcome/deleteSelfSoft':
//     case 'outcomeBase/deleteSelf':
//     case 'outcomeBase/deleteSelfSoft':
//     case 'outcome/restoreSelf':
//     case 'outcomeBase/restoreSelf':
//       newState = state.slice()
//       for (var i = 0; i < action.payload.extraData.length; i++) {
//         const new_nodeData = action.payload.extraData[i]
//         for (var j = 0; j < newState.length; j++) {
//           if (new_nodeData.id == newState[j].id) {
//             newState[j] = { ...newState[j], ...new_nodeData }
//           }
//         }
//       }
//       return newState
//     default:
//       return state
//   }
// }
