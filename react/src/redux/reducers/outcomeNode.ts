// @ts-nocheck
import * as Utility from "@cfUtility";

export default function outcomeNodeReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.outcomenode) return action.payload.outcomenode
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.outcomenode) {
        for (var i = 0; i < action.payload.outcomenode.length; i++) {
          const new_obj = action.payload.outcomenode[i]
          let added = false
          for (let j = 0; j < new_state.length; j++) {
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
      //Returns -1 if the outcome had already been added to the node
      if (action.payload.outcomenode == -1) return state
      var new_state = state.slice()
      const new_outcomenode_outcomes = action.payload.data_package.map(
        (outcomenode) =>
          Utility.cantorPairing(outcomenode.node, outcomenode.outcome)
      )
      const data_package_copy = action.payload.data_package.slice()
      for (var i = 0; i < new_state.length; i++) {
        const new_outcomenode_index = new_outcomenode_outcomes.indexOf(
          Utility.cantorPairing(new_state[i].node, new_state[i].outcome)
        )
        if (new_outcomenode_index >= 0) {
          new_state[i] = data_package_copy[new_outcomenode_index]
          data_package_copy[new_outcomenode_index] = null
        }
      }
      for (var i = 0; i < data_package_copy.length; i++) {
        if (data_package_copy[i] != null) new_state.push(data_package_copy[i])
      }
      new_state = new_state.filter((outcomenode) => outcomenode.degree > 0)
      return new_state
    case 'outcome/deleteSelf':
    case 'outcome_base/deleteSelf':
      new_state = state.slice()
      for (var i = 0; i < new_state.length; i++) {
        if (new_state[i].outcome == action.payload.id) {
          new_state.splice(i, 1)
          i--
        }
      }
      return new_state
    case 'week/insertBelow':
    case 'node/insertBelow':
    case 'outcome/insertChild':
    case 'outcome_base/insertChild':
    case 'outcome/insertBelow':
    case 'outcomeoutcome/changeID':
      if (!action.payload.children) return state
      new_state = state.slice()
      for (var i = 0; i < action.payload.children.outcomenode.length; i++) {
        new_state.push(action.payload.children.outcomenode[i])
      }
      return new_state
    default:
      return state
  }
}
