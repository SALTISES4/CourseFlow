import type { DraggableType } from '@cfViews/WorkflowView/componentViews/WorkflowEditViewV2/types'

import type { DraggableBlockType } from './Draggable/types'

type GroupType<T> = {
  title: string
  subtitle?: string
  readonly?: boolean
  groups?: T[]
}

export type RestorableBlock = {
  id: string
  label: string
}

export type OutcomeGroup = {
  title: string
  type: string
  blocks: DraggableBlockType[]
}

type AddGroup = {
  title: string
  type: DraggableType
  blocks: DraggableBlockType[]
}

export type RestoreGroup = {
  title: string
  blocks: RestorableBlock[]
}

export type AddTabType = GroupType<AddGroup>
export type OutcomesTabType = GroupType<OutcomeGroup>
export type RestoreTabType = GroupType<RestoreGroup>
export type RelatedTabType = GroupType<OutcomeGroup> & {
  alert?: boolean
}
