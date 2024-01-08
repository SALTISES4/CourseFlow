// @ts-nocheck
export default function columnReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.column) return action.payload.column
      return state
    case 'refreshStoreData': {
      var new_state = state.slice()
      if (action.payload.column) {
        for (var i = 0; i < action.payload.column.length; i++) {
          const new_obj = action.payload.collumn[i]
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
    }
    case 'column/createLock':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], lock: action.payload.lock }
          return new_state
        }
      }
      return state
    case 'column/deleteSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state.splice(i, 1)
          return new_state
        }
      }
      return state
    case 'column/deleteSelfSoft':
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
    case 'column/restoreSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], deleted: false }
          return new_state
        }
      }
      return state
    case 'node/newNode':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.column.id) return state
      }
      new_state = state.slice()
      new_state.push(action.payload.column)
      return new_state
    case 'column/insertBelow':
      new_state = state.slice()
      new_state.push(action.payload.new_model)
      return new_state
    case 'column/changeField':
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
    case 'strategy/addStrategy':
      if (action.payload.columns_added.length == 0) return state
      new_state = state.slice()
      new_state.push(...action.payload.columns_added)
      return new_state
    case 'column/reloadComments':
      var new_state = state.slice()
      for (var i = 0; i < new_state.length; i++) {
        const obj = new_state[i]
        if (obj.id == action.payload.id) {
          new_state[i] = { ...obj, comments: action.payload.comment_data }
          return new_state
        }
      }
      return state
    default:
      return state
  }
}
