import { Discipline, QueryPages } from '@cfModule/types/common'
import { ELibraryObject } from '@XMLHTTP/types/entity'

export type ExploreViewContextDataDTO = {
  initial_workflows: ELibraryObject[]
  initial_pages: QueryPages
  disciplines: Discipline[]
  user_id: number
}
