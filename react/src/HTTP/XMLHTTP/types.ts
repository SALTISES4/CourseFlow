import { TOutcomeOutcome } from '@cfRedux/types/type'
import {
  EColumn,
  EColumnworkflow,
  ENode,
  ENodelink,
  ENodeweek,
  EObjectSet,
  EOutcome,
  EOutcomeHorizontalLink,
  EOutcomeOutcome,
  EOutcomeWorkflow,
  EOutcomenode,
  EProject,
  EStrategy,
  EWeek,
  EWeekworkflow,
  EWorkflow
} from '@XMLHTTP/types/entity'

/*******************************************************
 *
 *******************************************************/

export type WorkflowParentDataPackage = {
  parentWorkflow: EWorkflow[]
  outcomeworkflow: EOutcomeWorkflow[]
  parentNode: ENode[]
  outcomenode: EOutcomenode[]
  outcome: EOutcome[]
  outcomeoutcome: TOutcomeOutcome[]
  outcomehorizontallink: EOutcomeHorizontalLink[]
}

export type WorkflowChildDataPackage = {
  node: ENode[]
  child_workflow: EWorkflow[]
  outcomeworkflow: EOutcomeWorkflow[]
  outcome: EOutcome[]
  outcomeoutcome: TOutcomeOutcome[]
  outcomehorizontallink: EOutcomeHorizontalLink[]
}

export type WorkflowDataPackage = {
  workflow: EWorkflow
  parentProject: EProject
  columnworkflow: EColumnworkflow[]
  column: EColumn[]
  weekworkflow: EWeekworkflow[]
  week: EWeek[]
  node: ENode[]
  nodelink: ENodelink[]
  nodeweek: ENodeweek[]
  outcome: EOutcome[]
  outcomenode: EOutcomenode[]
  outcomeworkflow: EOutcomeWorkflow[]
  outcomeoutcome: EOutcomeOutcome[]
  objectset: EObjectSet[]
  strategy: EStrategy[]
  //
  unreadComments: any[]
  saltise_strategy: EWorkflow[]
}
