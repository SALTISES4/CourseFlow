import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions
} from '@cfRedux/types/enumActions'

export default function parentNodeReducer(state = [], action) {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.parentNode || state

    case CommonActions.REFRESH_STOREDATA:
      if (!action.payload.parentNode) return state

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

    /*******************************************************
     * OUTCOME NODE
     *******************************************************/
    case OutcomeNodeActions.UPDATE_DEGREE:
      if (action.payload.outcomenode === -1) return state

      return state.map((item) =>
        item.id === action.payload.dataPackage[0].node
          ? {
              ...item,
              outcomenodeSet: action.payload.new_outcomenodeSet,
              outcomenodeUniqueSet: action.payload.new_outcomenodeUniqueSet
            }
          : item
      )

    /*******************************************************
     * OUTCOME
     *******************************************************/
    case OutcomeActions.DELETE_SELF:
    case OutcomeActions.DELETE_SELF_SOFT:
    case OutcomeActions.RESTORE_SELF:
    case OutcomeBaseActions.RESTORE_SELF:
    case OutcomeBaseActions.DELETE_SELF:
    case OutcomeBaseActions.DELETE_SELF_SOFT:
      return state.map((item, index) =>
        action.payload.extra_data.find((data) => data.id === item.id)
          ? {
              ...item,
              ...action.payload.extra_data.find((data) => data.id === item.id)
            }
          : item
      )

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
//           const new_obj = action.payload.parentNode[i]
//           let added = false
//           for (var j = 0; j < newState.length; j++) {
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
//     case 'outcomenode/updateDegree':
//       //Returns -1 if the outcome had already been added to the node at the given degree
//       if (action.payload.outcomenode == -1) return state
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.dataPackage[0].node) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i] }
//           newState[i].outcomenodeSet = action.payload.new_outcomenodeSet
//           newState[i].outcomenodeUniqueSet =
//             action.payload.new_outcomenodeUniqueSet
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
//       for (var i = 0; i < action.payload.extra_data.length; i++) {
//         const new_node_data = action.payload.extra_data[i]
//         for (var j = 0; j < newState.length; j++) {
//           if (new_node_data.id == newState[j].id) {
//             newState[j] = { ...newState[j], ...new_node_data }
//           }
//         }
//       }
//       return newState
//     default:
//       return state
//   }
// }
