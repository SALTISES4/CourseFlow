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

type EditTabType = GroupType<any>
type AddTabType = GroupType<AddGroup>
type RelatedTabType = GroupType<OutcomeGroup> & {
  alert?: boolean
}
type OutcomesTabType = GroupType<OutcomeGroup>

export type SidebarDataType = {
  edit: EditTabType
  add: AddTabType
  outcomes: OutcomesTabType
  related: RelatedTabType
}
