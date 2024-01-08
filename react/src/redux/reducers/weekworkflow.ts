// @ts-nocheck
export default function weekworkflowReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.weekworkflow) return action.payload.weekworkflow
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.weekworkflow) {
        for (var i = 0; i < action.payload.weekworkflow.length; i++) {
          const new_obj = action.payload.weekworkflow[i]
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
    case 'weekworkflow/movedTo':
      new_state = state.slice()
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          new_state[i] = { ...state[i], no_drag: true }
        }
      }
      return new_state
    case 'weekworkflow/changeID':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.old_id) {
          var new_state = state.slice()
          new_state[i] = {
            ...new_state[i],
            id: action.payload.new_id,
            no_drag: false
          }
          return new_state
        }
      }
      return state
    case 'week/deleteSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.parent_id) {
          var new_state = state.slice()
          new_state.splice(i, 1)
          return new_state
        }
      }
      return state
    case 'week/insertBelow':
      new_state = state.slice()
      new_state.push(action.payload.new_through)
      return new_state
    case 'strategy/addStrategy':
      new_state = state.slice()
      new_state.push(action.payload.new_through)
      return new_state
    default:
      return state
  }
}
