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
}

type AddGroup = {
  title: string
  type: string
  blocks: DraggableBlock[]
}

type AddTabType = GroupType<AddGroup>
type EditTabType = GroupType<any>
type OutcomesTabType = GroupType<any>
type RestoreTabType = GroupType<any>

export type SidebarDataType = {
  edit: EditTabType
  add: AddTabType
  outcomes: OutcomesTabType
  restore: RestoreTabType
}
