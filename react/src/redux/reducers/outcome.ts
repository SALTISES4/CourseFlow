// @ts-nocheck
export default  function outcomeReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.outcome) return action.payload.outcome
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.outcome) {
        for (var i = 0; i < action.payload.outcome.length; i++) {
          const new_obj = action.payload.outcome[i]
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
    case 'outcome/createLock':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], lock: action.payload.lock }
          return new_state
        }
      }
      return state
    case 'outcomeoutcome/changeID':
      var new_state = state.slice()
      for (var i = 0; i < state.length; i++) {
        const old_index = state[i].child_outcome_links.indexOf(
          action.payload.old_id
        )
        if (old_index >= 0) {
          new_state[i] = { ...new_state[i] }
          new_state[i].child_outcome_links =
            new_state[i].child_outcome_links.slice()
          new_state[i].child_outcome_links.splice(
            old_index,
            1,
            action.payload.new_id
          )
        }
      }
      return new_state
    case 'outcomeoutcome/movedTo':
      let old_parent, old_parent_index, new_parent, new_parent_index
      for (var i = 0; i < state.length; i++) {
        if (state[i].child_outcome_links.indexOf(action.payload.id) >= 0) {
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
      old_parent.child_outcome_links = old_parent.child_outcome_links.slice()
      old_parent.child_outcome_links.splice(
        old_parent.child_outcome_links.indexOf(action.payload.id),
        1
      )
      if (old_parent_index == new_parent_index) {
        old_parent.child_outcome_links.splice(new_index, 0, action.payload.id)
      } else {
        new_parent.child_outcome_links = new_parent.child_outcome_links.slice()
        new_parent.child_outcome_links.splice(new_index, 0, action.payload.id)
        new_state.splice(new_parent_index, 1, new_parent)
      }
      new_state.splice(old_parent_index, 1, old_parent)
      //insertedAt(action.payload.child_id,"outcome",new_parent.id,"outcome",new_index,"outcomeoutcome");
      return new_state
    case 'outcome_base/deleteSelf':
      var new_state = state.slice()
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          new_state.splice(i, 1)
          return new_state
        }
      }
      return state
    case 'outcome/deleteSelf':
      var new_state = state.slice()
      for (var i = 0; i < new_state.length; i++) {
        if (
          new_state[i].child_outcome_links.indexOf(action.payload.parent_id) >=
          0
        ) {
          new_state[i] = { ...new_state[i] }
          new_state[i].child_outcome_links =
            new_state[i].child_outcome_links.slice()
          new_state[i].child_outcome_links.splice(
            new_state[i].child_outcome_links.indexOf(action.payload.parent_id),
            1
          )
        } else if (new_state[i].id == action.payload.id) {
          new_state.splice(i, 1)
          i--
        }
      }
      return new_state
    case 'outcome/deleteSelfSoft':
      var new_state = state.slice()
      for (var i = 0; i < state.length; i++) {
        if (
          state[i].child_outcome_links.indexOf(action.payload.parent_id) >= 0
        ) {
          new_state[i] = { ...new_state[i] }
          new_state[i].child_outcome_links =
            state[i].child_outcome_links.slice()
          new_state[i].child_outcome_links.splice(
            new_state[i].child_outcome_links.indexOf(action.payload.parent_id),
            1
          )
        } else if (state[i].id == action.payload.id) {
          new_state[i] = {
            ...new_state[i],
            deleted: true,
            deleted_on: window.gettext('This session')
          }
        }
      }
      return new_state
    case 'outcome/restoreSelf':
      var new_state = state.slice()
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.parent_id) {
          new_state[i] = { ...new_state[i] }
          new_state[i].child_outcome_links =
            state[i].child_outcome_links.slice()
          new_state[i].child_outcome_links.splice(
            action.payload.throughparent_index,
            0,
            action.payload.throughparent_id
          )
        } else if (state[i].id == action.payload.id) {
          new_state[i] = { ...new_state[i], deleted: false }
        }
      }
      return new_state
    case 'outcome_base/deleteSelfSoft':
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
    case 'outcome_base/restoreSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], deleted: false }
          return new_state
        }
      }
      return state
    case 'outcome_base/insertBelow':
    case 'outcome/newOutcome':
      var new_state = state.slice()
      new_state.push(action.payload.new_model)
      if (action.payload.children) {
        for (var i = 0; i < action.payload.children.outcome.length; i++) {
          new_state.push(action.payload.children.outcome[i])
        }
      }
      return new_state
    case 'outcome/insertChild':
    case 'outcome_base/insertChild':
    case 'outcome/insertBelow':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.parentID) {
          var new_state = state.slice()
          new_state[i] = { ...state[i] }
          const new_child_outcome_links = state[i].child_outcome_links.slice()
          let new_index
          new_index = action.payload.new_through.rank
          new_child_outcome_links.splice(
            new_index,
            0,
            action.payload.new_through.id
          )
          new_state[i].child_outcome_links = new_child_outcome_links
          new_state.push(action.payload.new_model)
          if (action.payload.children) {
            for (var i = 0; i < action.payload.children.outcome.length; i++) {
              new_state.push(action.payload.children.outcome[i])
            }
          }
          return new_state
        }
      }
      return state
    case 'outcome/changeField':
    case 'outcome_base/changeField':
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
    case 'outcome/changeFieldMany':
    case 'outcome_base/changeFieldMany':
      if (
        action.payload.changeFieldID == COURSEFLOW_APP.contextData.changeFieldID
      )
        return state
      var new_state = state.slice()
      for (var i = 0; i < state.length; i++) {
        if (action.payload.ids.indexOf(state[i].id) >= 0) {
          new_state[i] = { ...state[i], ...action.payload.json }
        }
      }
      return new_state
    case 'outcomehorizontallink/updateDegree':
      //Returns -1 if the outcome had already been added to the node
      if (action.payload.outcomehorizontallink == -1) return state
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.data_package[0].outcome) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i] }
          new_state[i].outcome_horizontal_links =
            action.payload.new_outcome_horizontal_links
          new_state[i].outcome_horizontal_links_unique =
            action.payload.new_outcome_horizontal_links_unique
          return new_state
        }
      }
      return state
    case 'outcome/updateHorizontalLinks':
      var new_state = state.slice()
      for (var i = 0; i < action.payload.data.length; i++) {
        const new_outcome_data = action.payload.data[i]
        for (var j = 0; j < new_state.length; j++) {
          if (new_outcome_data.id == new_state[j].id) {
            new_state[j] = { ...new_state[j], ...new_outcome_data }
          }
        }
      }
      return new_state
    case 'outcome/reloadComments':
    case 'outcome_base/reloadComments':
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
