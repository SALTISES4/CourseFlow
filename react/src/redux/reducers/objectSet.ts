// @ts-nocheck
import { ObjectSetActions } from '@cfRedux/enumActions'
import { Objectset } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function objectSetReducer(
  state: Objectset[] = [],
  action: AnyAction
): Objectset[] {
  switch (action.type) {
    case ObjectSetActions.TOGGLE_OBJECT_SET:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, hidden: action.payload.hidden }
          : item
      )

    default:
      return state
  }
}
