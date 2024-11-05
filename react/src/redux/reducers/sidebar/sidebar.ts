import { CfObjectType } from '@cf/types/enum'
import { ReduxSlice } from '@cfRedux/types/enumActions'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export type SidebarState = {
  id: number
  objectType: CfObjectType
  parentId: number
} | null

const initialState: SidebarState = null

const sidebarSlice = createSlice({
  name: ReduxSlice.SIDEBAR,
  initialState,
  reducers: {
    set(state, action: PayloadAction<SidebarState>) {
      return action.payload || state
    }
  }
})

export default sidebarSlice
