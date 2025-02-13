import { SliceNamespace } from '@cf/redux/types/enumActions'
import { CfObjectType } from '@cf/types/enum'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export type SidebarState = {
  collapsed: boolean
  tab: null | 'edit' | 'add' | 'outcomes' | 'restore' | 'related'
  edit: Partial<EditTabState>
}

export type EditTabState = {
  id: number
  parentId: number
  objectType: CfObjectType
}

const initialState: SidebarState = {
  collapsed: true,
  tab: null,
  edit: {}
}

const sidebarSlice = createSlice({
  name: SliceNamespace.SIDEBAR,
  initialState,
  reducers: {
    collapse(state) {
      state.tab = null
      state.collapsed = true
    },
    edit(state, action: PayloadAction<Partial<EditTabState>>) {
      state.edit = action.payload
    },
    changeTab(
      state,
      action: PayloadAction<{ tab: SidebarState['tab']; collapsed: boolean }>
    ) {
      state.tab = action.payload.tab
      state.collapsed = action.payload.collapsed
    }
  }
})

export default sidebarSlice.reducer

export const {
  collapse: sidebarCollapse,
  edit: sidebarEdit,
  changeTab: sidebarChangeTab
} = sidebarSlice.actions
