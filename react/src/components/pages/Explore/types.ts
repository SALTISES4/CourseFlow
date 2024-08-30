import { Discipline, QueryPages } from '@cfModule/types/common'
import {ESectionObject} from "@XMLHTTP/types/entity";

export type ExploreViewContextDataDTO = {
  initial_workflows: ESectionObject[]
  initial_pages: QueryPages
  disciplines: Discipline[]
  user_id: number
}
