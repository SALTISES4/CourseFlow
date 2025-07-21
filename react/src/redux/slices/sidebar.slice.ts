import { SliceNamespace } from '@cf/redux/types/enumActions'
import { CfObjectType } from '@cf/types/enum'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export type SidebarState = {
  collapsed: boolean
  tab: null | 'edit' | 'add' | 'outcomes' | 'restore' | 'related' | 'comments'
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

function resetState(state: SidebarState) {
  state.tab = null
  state.collapsed = true
  state.edit = {}
}

const sidebarSlice = createSlice({
  name: SliceNamespace.SIDEBAR,
  initialState,
  reducers: {
    collapse(state) {
      state.tab = null
      state.collapsed = true
    },
    edit(
      state,
      action: PayloadAction<
        Partial<EditTabState & { tab: SidebarState['tab'] }>
      >
    ) {
      // if we're calling edit with the same payload as current state
      // we're essentially toggling the edit off and resetting
      if (
        state.edit.id === action.payload.id &&
        state.edit.objectType === action.payload.objectType &&
        state.edit.parentId === action.payload.parentId &&
        (state.tab === action.payload.tab ||
          !!state.tab === !action.payload.tab)
      ) {
        return resetState(state)
      }

      // if payload is empty, also reset everything
      if (!action.payload.id || !action.payload.objectType) {
        return resetState(state)
      }

      // if the payload contains id and object type, show edit tab
      if (action.payload.id && action.payload.objectType) {
        state.tab = 'edit'
        state.collapsed = false
      }

      // but if payload also has a tab property, show that tab instead
      if (action.payload.tab) {
        state.tab = action.payload.tab
      }

      // ... finally set whatever the payload was
      state.edit = action.payload
    },
    changeTab(
      state,
      action: PayloadAction<{ tab: SidebarState['tab']; collapsed: boolean }>
    ) {
      if (!action.payload.tab) {
        state.edit = {}
      }
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
