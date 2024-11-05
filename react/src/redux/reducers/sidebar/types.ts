import { CfObjectType } from '@cf/types/enum'

export type SidebarState = {
  collapsed: boolean
  edit: Partial<EditTabState>
}

export type EditTabState = {
  id: number
  parentId: number
  objectType: CfObjectType
}
