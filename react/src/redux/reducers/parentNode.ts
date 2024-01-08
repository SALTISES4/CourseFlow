// @ts-nocheck
export default function parentNodeReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.parent_node) return action.payload.parent_node
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.parent_node) {
        for (var i = 0; i < action.payload.parent_node.length; i++) {
          const new_obj = action.payload.parent_node[i]
          let added = false
          for (var j = 0; j < new_state.length; j++) {
            if (new_state[j].id == new_obj.id) {
              new_state.splice(j, 1, new_obj)
              added = true
              break
            }
          }
          if (added) continue
          new_state.push(new_obj)
        }
      }
      return new_state
    case 'outcomenode/updateDegree':
      //Returns -1 if the outcome had already been added to the node at the given degree
      if (action.payload.outcomenode == -1) return state
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.data_package[0].node) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i] }
          new_state[i].outcomenode_set = action.payload.new_outcomenode_set
          new_state[i].outcomenode_unique_set =
            action.payload.new_outcomenode_unique_set
          return new_state
        }
      }
      return state
    case 'outcome/deleteSelf':
    case 'outcome/deleteSelfSoft':
    case 'outcome_base/deleteSelf':
    case 'outcome_base/deleteSelfSoft':
    case 'outcome/restoreSelf':
    case 'outcome_base/restoreSelf':
      new_state = state.slice()
      for (var i = 0; i < action.payload.extra_data.length; i++) {
        const new_node_data = action.payload.extra_data[i]
        for (var j = 0; j < new_state.length; j++) {
          if (new_node_data.id == new_state[j].id) {
            new_state[j] = { ...new_state[j], ...new_node_data }
          }
        }
      }
      return new_state
    default:
      return state
  }
}
