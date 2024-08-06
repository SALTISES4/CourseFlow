import {
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions
} from '@cfRedux/types/enumActions'

export default function parentNodeReducer(state = [], action) {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.parent_node || state

    case CommonActions.REFRESH_STOREDATA:
      if (!action.payload.parent_node) return state

      return action.payload.parent_node.reduce(
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
        item.id === action.payload.data_package[0].node
          ? {
              ...item,
              outcomenode_set: action.payload.new_outcomenode_set,
              outcomenode_unique_set: action.payload.new_outcomenode_unique_set
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
//       if (action.payload.parent_node) return action.payload.parent_node
//       return state
//     case 'refreshStoreData':
//       var new_state = state.slice()
//       if (action.payload.parent_node) {
//         for (var i = 0; i < action.payload.parent_node.length; i++) {
//           const new_obj = action.payload.parent_node[i]
//           let added = false
//           for (var j = 0; j < new_state.length; j++) {
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
//     case 'outcomenode/updateDegree':
//       //Returns -1 if the outcome had already been added to the node at the given degree
//       if (action.payload.outcomenode == -1) return state
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.data_package[0].node) {
//           var new_state = state.slice()
//           new_state[i] = { ...new_state[i] }
//           new_state[i].outcomenode_set = action.payload.new_outcomenode_set
//           new_state[i].outcomenode_unique_set =
//             action.payload.new_outcomenode_unique_set
//           return new_state
//         }
//       }
//       return state
//     case 'outcome/deleteSelf':
//     case 'outcome/deleteSelfSoft':
//     case 'outcome_base/deleteSelf':
//     case 'outcome_base/deleteSelfSoft':
//     case 'outcome/restoreSelf':
//     case 'outcome_base/restoreSelf':
//       new_state = state.slice()
//       for (var i = 0; i < action.payload.extra_data.length; i++) {
//         const new_node_data = action.payload.extra_data[i]
//         for (var j = 0; j < new_state.length; j++) {
//           if (new_node_data.id == new_state[j].id) {
//             new_state[j] = { ...new_state[j], ...new_node_data }
//           }
//         }
//       }
//       return new_state
//     default:
//       return state
//   }
// }
