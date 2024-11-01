import { CfObjectType } from '@cf/types/enum'
import { SidebarActions } from '@cfRedux/types/enumActions'
import { AnyAction } from '@reduxjs/toolkit'

export type SidebarState = {
  id: number
  objectType: CfObjectType
  parentId: number
} | null

export interface SetSidebarAction extends AnyAction {
  type: SidebarActions
  payload: {
    id: number
    parentId?: number
    objectType: CfObjectType
  }
}

function sidebarReducer(state: SidebarState = null, action: SetSidebarAction) {
  switch (action.type) {
    case SidebarActions.SET_SIDEBAR_DATA:
      return action.payload || state
    default:
      return state
  }
}

export default sidebarReducer
