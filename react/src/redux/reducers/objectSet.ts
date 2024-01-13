import { ObjectSetActions } from '@cfRedux/enumActions'
import { ObjectSet } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function objectSetReducer(
  state: ObjectSet[] = [],
  action: AnyAction
): ObjectSet[] {
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
