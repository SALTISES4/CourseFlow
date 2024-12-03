import { DraggableType } from '@cf/components/pages/Workspace/Workflow/Sidebar/Draggable/Block/types'
import { SliceNamespace } from '@cf/redux/types/enumActions'
import { CfObjectType } from '@cf/types/enum'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export type SidebarState = {
  collapsed: boolean
  tab: null | 'edit' | 'add' | 'outcomes' | 'restore' | 'related'
  edit: Partial<EditTabState>
  dragging: {
    target: null | DraggableType
    coords: null | DragCoordsType
  }
}

type DragCoordsType = {
  groupId: number
  x: number
  y: number
}

export type EditTabState = {
  id: number
  parentId: number
  objectType: CfObjectType
}

const initialState: SidebarState = {
  collapsed: true,
  tab: null,
  edit: {},
  dragging: {
    target: null,
    coords: null
  }
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
    },
    dragTarget(state, action: PayloadAction<null | DraggableType>) {
      state.dragging.target = action.payload
    },
    updateDragCoords(state, action: PayloadAction<DragCoordsType>) {
      state.dragging.coords = action.payload
    }
  }
})

export default sidebarSlice.reducer

export const {
  collapse: sidebarCollapse,
  edit: sidebarEdit,
  changeTab: sidebarChangeTab,
  dragTarget: sidebarDragTarget,
  updateDragCoords: sidebarUpdateDragCoords
} = sidebarSlice.actions
