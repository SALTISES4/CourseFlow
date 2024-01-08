// @ts-nocheck
export default function outcomeworkflowReducer(state = [], action) {

  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.outcomeworkflow) return action.payload.outcomeworkflow
      return state
    case 'refreshStoreData': {
      const new_state = state.slice()
      if (action.payload.outcomeworkflow) {
        for (let i = 0; i < action.payload.outcomeworkflow.length; i++) {
          const new_obj = action.payload.outcomeworkflow[i]
          let added = false
          for (let j = 0; j < new_state.length; j++) {
            if (new_state[j].id === new_obj.id) {
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
    case 'outcomeworkflow/movedTo': {
      const new_state = state.slice()
      for (let i = 0; i < state.length; i++) {
        if (state[i].id === action.payload.id) {
          new_state[i] = { ...state[i], no_drag: true }
        }
      }
      return new_state
    }
    case 'outcomeworkflow/changeID': {
      for (let i = 0; i < state.length; i++) {
        if (state[i].id === action.payload.old_id) {
          const new_state = state.slice()
          new_state[i] = {
            ...new_state[i],
            id: action.payload.new_id,
            no_drag: false
          }
          return new_state
        }
      }
      return state
    }
    case 'outcome_base/deleteSelf': {
      for (let i = 0; i < state.length; i++) {
        if (state[i].outcome == action.payload.id) {
          const new_state = state.slice()
          new_state.splice(i, 1)
          return new_state
        }
      }
      return state
    }
    case 'outcome_base/insertBelow': {
      const new_state = state.slice()
      new_state.push(action.payload.new_through)
      return new_state
    }
    case 'outcome/newOutcome': {
      const new_state = state.slice()
      new_state.push(action.payload.new_through)
      return new_state
    }
    default:
      return state
  }
}
