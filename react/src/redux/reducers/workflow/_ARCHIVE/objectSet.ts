import { ObjectSetActions } from '@cfRedux/types/enumActions'
import { TObjectSet } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

interface ToggleObjectSetAction extends AnyAction {
  type: ObjectSetActions.TOGGLE_OBJECT_SET
  payload: {
    id: number
    hidden: boolean
  }
}

export default function objectSetReducer(
  state: TObjectSet[] = [],
  action: ToggleObjectSetAction
): TObjectSet[] {
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
