import { ObjectSetActions } from '@cfRedux/types/enumActions'
import { TObjectSet } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function objectSetReducer(
  state: TObjectSet[] = [],
  action: AnyAction
): TObjectSet[] {
  switch (action.type) {
    case ObjectSetActions.TOGGLE_OBJECT_SET:
      return state.map((item) =>
        // @ts-ignore
        item.id === action.payload.id
          ? { ...item, hidden: action.payload.hidden }
          : item
      )

    default:
      return state
  }
}
