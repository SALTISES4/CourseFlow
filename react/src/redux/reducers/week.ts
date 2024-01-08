// @ts-nocheck
export default function weekReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.week) return action.payload.week
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.week) {
        for (var i = 0; i < action.payload.week.length; i++) {
          const new_obj = action.payload.week[i]
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
    case 'week/createLock':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], lock: action.payload.lock }
          return new_state
        }
      }
      return state
    case 'nodeweek/changeID':
      var new_state = state.slice()
      for (var i = 0; i < state.length; i++) {
        const old_index = state[i].nodeweek_set.indexOf(action.payload.old_id)
        if (old_index >= 0) {
          new_state[i] = { ...new_state[i] }
          new_state[i].nodeweek_set = new_state[i].nodeweek_set.slice()
          new_state[i].nodeweek_set.splice(old_index, 1, action.payload.new_id)
        }
      }
      return new_state
    case 'nodeweek/movedTo':
      let old_parent, old_parent_index, new_parent, new_parent_index
      for (var i = 0; i < state.length; i++) {
        if (state[i].nodeweek_set.indexOf(action.payload.id) >= 0) {
          old_parent_index = i
          old_parent = { ...state[i] }
        }
        if (state[i].id == action.payload.new_parent) {
          new_parent_index = i
          new_parent = { ...state[i] }
        }
      }
      var new_index = action.payload.new_index

      var new_state = state.slice()
      old_parent.nodeweek_set = old_parent.nodeweek_set.slice()
      old_parent.nodeweek_set.splice(
        old_parent.nodeweek_set.indexOf(action.payload.id),
        1
      )
      if (old_parent_index == new_parent_index) {
        old_parent.nodeweek_set.splice(new_index, 0, action.payload.id)
      } else {
        new_parent.nodeweek_set = new_parent.nodeweek_set.slice()
        new_parent.nodeweek_set.splice(new_index, 0, action.payload.id)
        new_state.splice(new_parent_index, 1, new_parent)
      }
      new_state.splice(old_parent_index, 1, old_parent)
      return new_state
    case 'node/deleteSelf':
    case 'node/deleteSelfSoft':
      for (var i = 0; i < state.length; i++) {
        if (state[i].nodeweek_set.indexOf(action.payload.parent_id) >= 0) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i] }
          new_state[i].nodeweek_set = state[i].nodeweek_set.slice()
          new_state[i].nodeweek_set.splice(
            new_state[i].nodeweek_set.indexOf(action.payload.parent_id),
            1
          )
          return new_state
        }
      }
      return state
    case 'node/restoreSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.parent_id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i] }
          new_state[i].nodeweek_set = state[i].nodeweek_set.slice()
          new_state[i].nodeweek_set.splice(
            action.payload.throughparent_index,
            0,
            action.payload.throughparent_id
          )
          return new_state
        }
      }
      return state
    case 'node/insertBelow':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.parentID) {
          var new_state = state.slice()
          new_state[i] = { ...state[i] }
          var new_nodeweek_set = state[i].nodeweek_set.slice()
          new_nodeweek_set.splice(
            action.payload.new_through.rank,
            0,
            action.payload.new_through.id
          )
          new_state[i].nodeweek_set = new_nodeweek_set
          return new_state
        }
      }
      return state
    case 'node/newNode':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.parentID) {
          var new_state = state.slice()
          new_state[i] = { ...state[i] }
          var new_nodeweek_set = state[i].nodeweek_set.slice()
          new_nodeweek_set.splice(
            action.payload.index,
            0,
            action.payload.new_through.id
          )
          new_state[i].nodeweek_set = new_nodeweek_set
          return new_state
        }
      }
      return state
    case 'week/insertBelow':
      new_state = state.slice()
      new_state.push(action.payload.new_model)
      return new_state
    case 'week/deleteSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state.splice(i, 1)
          return new_state
        }
      }
      return state
    case 'week/deleteSelfSoft':
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
    case 'week/restoreSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], deleted: false }
          return new_state
        }
      }
      return state
    case 'week/changeField':
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
    case 'strategy/toggleStrategy':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...state[i] }
          new_state[i].is_strategy = action.payload.is_strategy
          return new_state
        }
      }
      return state
    case 'strategy/addStrategy':
      new_state = state.slice()
      new_state.push(action.payload.strategy)
      return new_state
    case 'week/reloadComments':
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
