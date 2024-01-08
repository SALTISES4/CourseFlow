// @ts-nocheck
export default  function nodelinkReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.nodelink) return action.payload.nodelink
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.nodelink) {
        for (var i = 0; i < action.payload.nodelink.length; i++) {
          const new_obj = action.payload.nodelink[i]
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
    case 'nodelink/createLock':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], lock: action.payload.lock }
          return new_state
        }
      }
      return state
    case 'nodelink/changeField':
      if (
        action.payload.changeFieldID == COURSEFLOW_APP.contextData.changeFieldID
      )
        return state
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...state[i], ...action.payload.json }
          return new_state
        }
      }
      return state
    case 'node/insertBelow':
    case 'node/newNode':
    case 'node/deleteSelf':
      return state
    case 'nodelink/newNodeLink':
      new_state = state.slice()
      new_state.push(action.payload.new_model)
      return new_state
    case 'nodelink/deleteSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state.splice(i, 1)
          return new_state
        }
      }
      return state
    case 'nodelink/deleteSelfSoft':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = {
            ...new_state[i],
            deleted: true,
            deleted_on: window.gettext('This session')
          }
          return new_state
        }
      }
      return state
    case 'nodelink/restoreSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], deleted: false }
          return new_state
        }
      }
      return state
    case 'week/insertBelow':
      if (!action.payload.children) return state
      new_state = state.slice()
      for (var i = 0; i < action.payload.children.nodelink.length; i++) {
        new_state.push(action.payload.children.nodelink[i])
      }
      return new_state
    case 'strategy/addStrategy':
      if (action.payload.nodelinks_added.length == 0) return state
      new_state = state.slice()
      new_state.push(...action.payload.nodelinks_added)
      return new_state
    default:
      return state
  }
}
