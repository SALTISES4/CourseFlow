import { LibrarySortDirectionIn, LibrarySortValueIn } from '@cf/api/gen'

export type SearchFilterGroup = {
  name: string
  label: string
  selectMultiple?: boolean
  options?: SearchFilterOption[]
  value?: string | boolean
}

export type SearchFilterOption = {
  value: string | number | null
  label: string
  enabled?: boolean
}

export type FilterOption = {
  value: string
  label: string
  enabled?: boolean
}

export type SortOption = {
  value: LibrarySortValueIn
  label: string
  enabled?: boolean
  direction?: LibrarySortDirectionIn
}
