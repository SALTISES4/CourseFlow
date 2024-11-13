import { SidebarActions } from '@cf/redux/types/enumActions'
import { EditTabState, SidebarState } from '@cfRedux/reducers/sidebar/types'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

const initialState: SidebarState = {
  collapsed: true,
  tab: null,
  edit: {}
}

const sidebarSlice = createSlice({
  name: 'sidebar',
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

export const { collapse, edit, changeTab } = sidebarSlice.actions

// import { createReducer } from '@reduxjs/toolkit'
//
// import { SidebarChangeTab, SidebarCollapse, SidebarEdit } from './actions'
// import { SidebarState } from './types'
//
// const initialState: SidebarState = {
//   collapsed: true,
//   tab: null,
//   edit: {}
// }
// // @todo maybe move this to createSlice
// const sidebarReducer = createReducer(initialState, (builder) => {
//   builder.addCase(SidebarCollapse, (state) => {
//     state.tab = null
//     state.collapsed = true
//   })
//
//   builder.addCase(SidebarEdit, (state, action) => {
//     state.edit = action.payload
//   })
//
//   builder.addCase(SidebarChangeTab, (state, action) => {
//     state.tab = action.payload.tab
//     state.collapsed = action.payload.collapsed
//   })
// })
//
// export default sidebarReducer
