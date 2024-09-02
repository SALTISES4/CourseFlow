export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

export type SearchOption = {
  name: string
  label: string
  value?: boolean | string | number | number[] | string[] | SortDirection
  enabled?: boolean
}

export type FilterOption = {
  name: string
  label: string
  value: boolean | string | number | number[] | string[]
  enabled?: boolean
}

export type SortOption = {
  name: string
  label: string
  enabled?: boolean
  direction?: SortDirection
}
// export type Filters = {
//   keyword: string
//   filterSortOptions: SortOption[]
//   filterProjectOptions: FilterOption[]
// }
