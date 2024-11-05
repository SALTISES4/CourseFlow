import { WorkflowSidebarActions } from '@cfRedux/types/enumActions'
import { createReducer } from '@reduxjs/toolkit'

import { SET_EDIT } from './actions'
import { SidebarState } from './types'

const initialState: Partial<SidebarState> = {
  collapsed: true,
  edit: {}
}

const sidebarReducer = createReducer(initialState, (builder) => {
  builder.addCase(SET_EDIT, (state, action) => {
    state.edit = action.payload
  })

  builder.addCase(WorkflowSidebarActions.TOGGLE, (state) => {
    state.collapsed = !state.collapsed
  })
})

export default sidebarReducer
