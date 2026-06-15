import type { DraggableType } from '@cfViews/WorkflowView/GraphView/types'

import type { DraggableItemType } from './components/AddTab/Draggable/types'

type GroupType<T> = {
  title: string
  subtitle?: string
  readonly?: boolean
  groups?: T[]
}

type AddGroup = {
  title: string
  type: DraggableType
  blocks: DraggableItemType[]
}

export type AddTabType = GroupType<AddGroup>
