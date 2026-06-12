import { LibrarySortDirectionIn, LibrarySortValueIn } from '@cf/api/gen'
import { PropsType as FilterPropsType } from '@cfComponents/filters/FilterToggle'

export type SearchFilterGroup = {
  name: string
  label: string
  selectMultiple?: boolean
  options?: SearchFilterOption[]
  value?: string | boolean
  color?: FilterPropsType['color']
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
