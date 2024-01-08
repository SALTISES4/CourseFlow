// @ts-nocheck
export default function objectSetReducer(state = [], action) {
  switch (action.type) {
    case 'objectset/toggleObjectSet':
      for (let i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          const new_state = state.slice()
          new_state[i] = { ...new_state[i], hidden: action.payload.hidden }
          return new_state
        }
      }
      return state
    default:
      return state
  }
}
