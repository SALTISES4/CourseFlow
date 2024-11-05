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

export type RestoreGroup = {
  title: string
  blocks: RestorableBlock[]
}

export type RestoreTabType = GroupType<RestoreGroup>
