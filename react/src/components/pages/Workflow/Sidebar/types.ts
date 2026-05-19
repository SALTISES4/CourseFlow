import type { DraggableType } from '@cf/components/views/WorkflowView/GraphView/types'

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
