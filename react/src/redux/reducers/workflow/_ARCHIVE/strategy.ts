import { StrategyActions } from '@cfRedux/types/enumActions'
import { TStrategy } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

interface ToggleStrategyAction extends AnyAction {
  type: StrategyActions.TOGGLE_STRATEGY
  payload: {
    isStrategy: boolean
    strategy: TStrategy
  }
}

type StrategyActionTypes = ToggleStrategyAction

export default function strategyReducer(
  state: TStrategy[] = [],
  action: StrategyActionTypes
): TStrategy[] {
  switch (action.type) {
    case StrategyActions.TOGGLE_STRATEGY:
      return action.payload.isStrategy
        ? [...state, action.payload.strategy]
        : state
    default:
      return state
  }
}
