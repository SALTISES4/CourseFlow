import { LibraryObjectType } from '@cf/types/enum'
import { ObjectSetType } from '@cfComponents/dialog/common/ProjectCreateDialog/type'
import { SearchOption } from '@cfComponents/filters/types'

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

export type LibraryObjectsSearchQueryArgs = {
  resultsPerPage?: number
  page?: number
  fullSearch?: boolean
  sort?: SearchOption
  filters?: SearchOption[]
}

// @todo rename this, it's not toggling
export type ToggleFavouriteMutationArgs = {
  id: number
  type: LibraryObjectType
  favourite: boolean
}

/*******************************************************
 * ARGS
 *******************************************************/
export type CreateProjectArgs = {
  description: string
  title: string
  disciplines: number[]
  objectSets: ObjectSetType[]
}

export type UpdateWorkflowArgs = {
  description: string
  duration: string
  title: string
  units: number
}
