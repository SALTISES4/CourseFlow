import { SidebarActions } from '@cf/redux/types/enumActions'
import { createAction } from '@reduxjs/toolkit'

import { SidebarState } from './types'

export const SidebarEdit = createAction<SidebarState['edit']>(
  SidebarActions.EDIT
)

export const SidebarCollapse = createAction(SidebarActions.COLLAPSE)

export const SidebarChangeTab = createAction<{
  tab: SidebarState['tab']
  collapsed: SidebarState['collapsed']
}>(SidebarActions.CHANGE_TAB)
