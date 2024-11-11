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

export type OutcomeGroup = {
  title: string
  type: string
  blocks: DraggableBlock[]
}

type EditTabType = GroupType<any>

type AddGroup = {
  title: string
  type: string
  blocks: DraggableBlock[]
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
