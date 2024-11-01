import { CfObjectType } from '@cf/types/enum'
import { SidebarActions } from '@cfRedux/types/enumActions'
import { AnyAction } from '@reduxjs/toolkit'

type SideBarState = {
  id: number
  objectType: CfObjectType
  parentId: number
} | null

export interface SetSidebarAction extends AnyAction {
  type: SidebarActions
  payload: {
    id: number
    objectType: CfObjectType
    parentId?: number
  }
}

function sidebarReducer(
  state: SideBarState = null,
  action: SetSidebarAction
) {
  switch (action.type) {
    case SidebarActions.SET_SIDEBAR_DATA:
      return action.payload || state
    default:
      return state
  }
}

export default sidebarReducer
