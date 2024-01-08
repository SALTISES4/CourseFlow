// @ts-nocheck
import * as Utility from "@cfUtility";

export default function outcomeHorizontalLinkReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.outcomehorizontallink)
        return action.payload.outcomehorizontallink
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.outcomehorizontallink) {
        for (var i = 0; i < action.payload.outcomehorizontallink.length; i++) {
          const new_obj = action.payload.outcomehorizontallink[i]
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
    case 'outcomehorizontallink/updateDegree':
      //Returns -1 if the outcome had already been added to the node
      if (action.payload.outcomehorizontallink == -1) return state
      var new_state = state.slice()
      const new_outcomehorizontallink_outcomes =
        action.payload.data_package.map((outcomehorizontallink) =>
          Utility.cantorPairing(
            outcomehorizontallink.outcome,
            outcomehorizontallink.parent_outcome
          )
        )
      const data_package_copy = action.payload.data_package.slice()
      for (var i = 0; i < new_state.length; i++) {
        const new_outcomehorizontallink_index =
          new_outcomehorizontallink_outcomes.indexOf(
            Utility.cantorPairing(
              new_state[i].outcome,
              new_state[i].parent_outcome
            )
          )
        if (new_outcomehorizontallink_index >= 0) {
          new_state[i] = data_package_copy[new_outcomehorizontallink_index]
          data_package_copy[new_outcomehorizontallink_index] = null
        }
      }
      for (var i = 0; i < data_package_copy.length; i++) {
        if (data_package_copy[i] != null) new_state.push(data_package_copy[i])
      }
      new_state = new_state.filter(
        (outcomehorizontallink) => outcomehorizontallink.degree > 0
      )
      return new_state
    default:
      return state
  }
}
