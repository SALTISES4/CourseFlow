import { CfObjectType } from '@cf/types/enum'

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
