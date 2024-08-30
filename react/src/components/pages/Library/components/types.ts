export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

export type FilterOption = {
  name: string
  label: string
  selected?: boolean
}

export type SortableFilterOption = {
  name: string
  label: string
  selected?: boolean
  direction?: SortDirection
}
export type Filters = {
  keyword: string
  filterSortOptions: SortableFilterOption[]
  filterProjectOptions: FilterOption[]
}
