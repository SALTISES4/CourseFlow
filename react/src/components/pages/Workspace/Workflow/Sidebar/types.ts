type GroupType<T> = {
  title: string
  subtitle?: string
  readonly?: boolean
  groups?: T[]
}

export type DraggableBlock = {
  id: number
  label: string
  type: string
  blocks?: DraggableBlock[]
}

export type RestorableBlock = {
  id: string
  label: string
}

type AddGroup = {
  title: string
  type: string
  blocks: DraggableBlock[]
}

export type OutcomeGroup = {
  title: string
  type: string
  blocks: DraggableBlock[]
}

export type RestoreGroup = {
  title: string
  blocks: RestorableBlock[]
}

type EditTabType = GroupType<any>
type AddTabType = GroupType<AddGroup>
type RelatedTabType = GroupType<OutcomeGroup> & {
  alert?: boolean
}
type OutcomesTabType = GroupType<OutcomeGroup>
type RestoreTabType = GroupType<RestoreGroup>

export type SidebarDataType = {
  edit: EditTabType
  add: AddTabType
  outcomes: OutcomesTabType
  restore: RestoreTabType
  related: RelatedTabType
}
