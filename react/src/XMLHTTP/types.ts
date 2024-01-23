import { TOutcomeOutcome } from '@cfRedux/types/type'
import {
  EColumn,
  EColumnworkflow,
  ENode,
  ENodelink,
  ENodeweek,
  EOutcome,
  EOutcomeHorizontalLink,
  EOutcomenode,
  EOutcomeWorkflow,
  EWeek,
  EWeekworkflow,
  EWorkflow,
  EProject,
} from '@XMLHTTP/types/entity'
import { FieldChoice } from '@cfModule/types/common'

/*******************************************************
 *
 *******************************************************/

export type WorkflowDataPackage = {
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

export type WorkflowParentDataPackage = {
  parent_workflow: EWorkflow[]
  outcomeworkflow: EOutcomeWorkflow[]
  parent_node: ENode[]
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

export type WorkflowContextData = {
  //  Should probably be changed to:
  //  data_package: {
  //   is_strategy: boolean
  //   column_choices: FieldChoice[]
  //   context_choices: FieldChoice[]
  //   task_choices: FieldChoice[]
  //   time_choices: FieldChoice[]
  //   outcome_type_choices: FieldChoice[]
  //   outcome_sort_choices: FieldChoice[]
  //   strategy_classification_choices: FieldChoice[]
  //   project: EProject
  // }
  data_package: string
  is_strategy: boolean
  user_permission: number
}

