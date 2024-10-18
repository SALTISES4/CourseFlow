import { CommonActions } from '@cfRedux/types/enumActions'
import { TProject } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function parentProjectReducer(
  state: TProject = {} as TProject,
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

    // pretty obvious what this is doing
    // BUT really it should be cleaning up all the workflow related objects
    // columnworfklow
    // node
    // week etc
    // ideally all workflow store is grouped under one entry in redux
    case CommonActions.CLEAR_WORKFLOW_DATA:
      return null

    default:
      return state
  }
}
