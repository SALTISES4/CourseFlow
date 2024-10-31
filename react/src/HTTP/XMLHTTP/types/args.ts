import { LibraryObjectType } from '@cf/types/enum'
import {
  SortDirection,
  SortValueOption
} from '@cfComponents/filters/SortableFilterButton'
import { SearchFilterOption } from '@cfComponents/filters/types'

// types of filter

// FROM  EXPLORE
// activeDisciplines: [number]
// type: [LibraryObjectType]
// contentRich: boolean
// fromSaltise: boolean

// FROM LIB
// owned: boolean
// shared: ?
// favorited: boolean
// archived: boolean

// all query options are optional,
// defaults set in backend for now

export type FilterResult = {
  name: string
  value: string | boolean | number | string[] | number[]
}[]
export type LibraryObjectsSearchQueryArgs = {
  pagination?: {
    page: number
    resultsPerPage?: number
  }
  sort?: {
    direction: SortDirection
    value: SortValueOption
  } | null
  filters?: FilterResult
}

// @todo rename this, it's not toggling
export type ToggleFavouriteMutationArgs = {
  id: number
  objectType: LibraryObjectType
  favourite: boolean
}

export type SearchFilterArgs = () => {}
