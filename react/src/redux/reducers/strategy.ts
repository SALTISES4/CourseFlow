import { TStrategy } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'
import { StrategyActions } from '@cfRedux/types/enumActions'

export default function strategyReducer(
  state: TStrategy[] = [],
  action: AnyAction
): TStrategy[] {
  switch (action.type) {
    case StrategyActions.TOGGLE_STRATEGY:
      return action.payload.is_strategy
        ? [...state, action.payload.strategy]
        : state
    default:
      return state
  }
}
