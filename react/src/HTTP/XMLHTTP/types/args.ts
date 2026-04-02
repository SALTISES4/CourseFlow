import { LibraryObjectType } from '@cf/types/enum'
import {
  SortDirection,
  SortValueOption
} from '@cfComponents/filters/SortableFilterButton'



// @todo rename this, it's not toggling
export type ToggleFavouriteMutationArgs = {
  id: string
  objectType: LibraryObjectType
  favourite: boolean
}

export type SearchFilterArgs = () => {}
