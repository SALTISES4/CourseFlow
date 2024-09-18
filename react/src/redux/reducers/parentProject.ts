import { CommonActions } from '@cfRedux/types/enumActions'
import { TProject } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function parentProjectReducer(
  state: TProject = {},
  action: AnyAction
): TProject {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      if (action.payload.parentProject) {
        return action.payload.parentProject
      }
      return state

    case CommonActions.REFRESH_STOREDATA:
      if (action.payload.parentProject) {
        return action.payload.parentProject
      }
      return state

    default:
      return state
  }
}
