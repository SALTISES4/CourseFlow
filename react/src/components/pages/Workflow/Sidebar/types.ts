import type { DraggableType } from '@cf/components/views/WorkflowView/GraphView/types'
import type { Outcome } from '@cf/redux/slices/outcomes.slice'

import type { DraggableItemType } from './components/AddTab/Draggable/types'

type GroupType<T> = {
  title: string
  subtitle?: string
  readonly?: boolean
  groups?: T[]
}

export type RestorableBlock = {
  uuid: string
  label: string
}

export type OutcomeGroup = Outcome['uuid']

type AddGroup = {
  title: string
  type: DraggableType
  blocks: DraggableItemType[]
}

export type RestoreGroup = {
  title: string
  blocks: RestorableBlock[]
}

export type AddTabType = GroupType<AddGroup>
export type OutcomesTabType = GroupType<OutcomeGroup>
export type RelatedTabType = GroupType<OutcomeGroup> & {
  alert?: boolean
}
