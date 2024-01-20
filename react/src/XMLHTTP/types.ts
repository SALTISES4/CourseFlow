import { TOutcomeOutcome } from '@cfRedux/type'
import {
  EColumn,
  EColumnworkflow,
  ENode,
  ENodelink,
  ENodeweek,
  EOutcome,
  EOutcomenode,
  EOutcomeWorkflow,
  EWeek,
  EWeekworkflow,
  EWorkflow
} from '@XMLHTTP/types/entity'

/*******************************************************
 *
 *******************************************************/

export type DataPackage = {
  workflow: EWorkflow
  columnworkflow: EColumnworkflow[]
  column: EColumn[]
  weekworkflow: EWeekworkflow[]
  week: EWeek[]
  nodeweek: ENodeweek[]
  nodelink: ENodelink[]
  node: ENode[]
  outcomeworkflow: EOutcomeWorkflow[]
  outcome: EOutcome[]
  outcomenode: EOutcomenode[]
  saltise_strategy: EWorkflow[]
  outcomeoutcome: TOutcomeOutcome[]
  // @todo still missing types
  objectset: any[]
  strategy: any[]
  unread_comments: any[]
}
