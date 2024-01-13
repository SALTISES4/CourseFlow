import { Strategy } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'
import { StrategyActions } from '@cfRedux/enumActions'

export default function strategyReducer(
  state: Strategy[] = [],
  action: AnyAction
): Strategy[] {
  switch (action.type) {
    case StrategyActions.TOGGLE_STRATEGY:
      return action.payload.is_strategy
        ? [...state, action.payload.strategy]
        : state
    default:
      return state
  }
}
