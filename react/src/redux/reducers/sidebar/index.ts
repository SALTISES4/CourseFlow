import { createReducer } from '@reduxjs/toolkit'

import { SidebarChangeTab, SidebarCollapse, SidebarEdit } from './actions'
import { SidebarState } from './types'

const initialState: SidebarState = {
  collapsed: true,
  tab: null,
  edit: {}
}

const sidebarReducer = createReducer(initialState, (builder) => {
  builder.addCase(SidebarCollapse, (state) => {
    state.tab = null
    state.collapsed = true
  })

  builder.addCase(SidebarEdit, (state, action) => {
    state.edit = action.payload
  })

  builder.addCase(SidebarChangeTab, (state, action) => {
    state.tab = action.payload.tab
    state.collapsed = action.payload.collapsed
  })
})

export default sidebarReducer
