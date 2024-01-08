// @ts-nocheck
export default function strategyReducer(state = [], action) {
  switch (action.type) {
    case 'strategy/toggleStrategy':
      if (!action.payload.is_strategy) return state
      const new_state = state.slice()
      new_state.push(action.payload.strategy)
      return new_state
    default:
      return state
  }
}
