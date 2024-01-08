// @ts-nocheck
export default  function nodeweekReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.nodeweek) return action.payload.nodeweek
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.nodeweek) {
        for (var i = 0; i < action.payload.nodeweek.length; i++) {
          const new_obj = action.payload.nodeweek[i]
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
    case 'nodeweek/changeID':
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
    case 'node/deleteSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.parent_id) {
          var new_state = state.slice()
          new_state.splice(i, 1)
          return new_state
        }
      }
      return state
    case 'nodeweek/movedTo':
      new_state = state.slice()
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          new_state[i] = {
            ...state[i],
            week: action.payload.new_parent,
            no_drag: true
          }
        }
      }
      return new_state
    case 'week/insertBelow':
      if (!action.payload.children) return state
      new_state = state.slice()
      for (var i = 0; i < action.payload.children.nodeweek.length; i++) {
        new_state.push(action.payload.children.nodeweek[i])
      }
      return new_state
    case 'node/insertBelow':
    case 'node/newNode':
      new_state = state.slice()
      new_state.push(action.payload.new_through)
      return new_state
    case 'strategy/addStrategy':
      if (action.payload.nodeweeks_added.length == 0) return state
      new_state = state.slice()
      new_state.push(...action.payload.nodeweeks_added)
      return new_state
    default:
      return state
  }
}
