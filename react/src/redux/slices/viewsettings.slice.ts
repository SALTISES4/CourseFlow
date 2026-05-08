import { SliceNamespace } from '@cf/redux/types/enumActions'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export type ViewsettingsState = {
  expandedSections: boolean
  expandedNodes: boolean
  expandedOutcomes: boolean
  condensed: boolean
  legend: boolean
  objectset: number[]
}

const loadStateFromLocalStorage = (): ViewsettingsState => {
  const savedState = localStorage.getItem('viewSettings')
  if (savedState) {
    try {
      return JSON.parse(savedState) as ViewsettingsState
    } catch (error) {
      console.error('Failed to parse viewSettings from localStorage:', error)
    }
  }
  return {
    expandedSections: true,
    expandedNodes: true,
    expandedOutcomes: true,
    condensed: false,
    legend: false,
    objectset: []
  }
}

const initialState: ViewsettingsState = loadStateFromLocalStorage()
export const viewsettingsSlice = createSlice({
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
