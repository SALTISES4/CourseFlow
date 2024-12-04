import { SliceNamespace } from '@cf/redux/types/enumActions'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export type ViewsettingsState = {
  expandedWeeks: boolean
  expandedNodes: boolean
  expandedOutcomes: boolean
  condensed: boolean
  legend: boolean
  objectset: number[]
}

// this should come from localstorage
const initialState: ViewsettingsState = {
  expandedWeeks: true,
  expandedNodes: true,
  expandedOutcomes: true,
  condensed: false,
  legend: false,
  objectset: []
}

const viewsettingsSlice = createSlice({
  name: SliceNamespace.VIEWSETTINGS,
  initialState,
  reducers: {
    update(state, action: PayloadAction<Partial<ViewsettingsState>>) {
      return { ...state, ...action.payload }
    },
    toggle(state, action: PayloadAction<{ key: string }>) {
      state[action.payload.key] = !state[action.payload.key]
    }
  }
})

export default viewsettingsSlice.reducer

export const { update: viewsettingsUpdate, toggle: viewsettingsToggle } =
  viewsettingsSlice.actions
