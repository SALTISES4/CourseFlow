import { Discipline, QueryPages, Workflow } from '@cfModule/types/common'

export type ExploreViewContextDataDTO = {
  initial_workflows: Workflow[]
  initial_pages: QueryPages
  disciplines: Discipline[]
  user_id: number
}
