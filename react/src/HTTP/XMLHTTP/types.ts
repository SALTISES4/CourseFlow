import { TObjectSet, TOutcomeOutcome, TStrategy } from '@cfRedux/types/type'
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
  EObjectSet,
  EStrategy,
  EOutcomeOutcome
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
  unread_comments: any[]
  saltise_strategy: EWorkflow[]
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
  data_package: EWorkflowDataPackage
  is_strategy: boolean
  user_permission: number
}

// @todo differentiate from above WorkflowDataPackage
export type EWorkflowDataPackage = {
  is_strategy: boolean
  column_choices: FieldChoice[]
  context_choices: FieldChoice[]
  task_choices: FieldChoice[]
  time_choices: FieldChoice[]
  outcome_type_choices: FieldChoice[]
  outcome_sort_choices: FieldChoice[]
  strategy_classification_choices: FieldChoice[]
  project: EProject
}
