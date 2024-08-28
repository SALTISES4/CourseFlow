import { WorkflowType } from '@cfModule/types/enum'
import {
  EColumn,
  EDate,
  ENode,
  ENodelink,
  ENodeweek,
  EObjectSet,
  EOutcome,
  EOutcomenode,
  EOutcomeOutcome,
  EOutcomeWorkflow,
  EStrategy,
  EUser,
  EWeek,
  EWeekworkflow,
  EWorkflow
} from '@XMLHTTP/types/entity'
import { Lock } from '@cfModule/types/common'

export type AppState = {
  workflow: TWorkflow
  columnworkflow: TColumnworkflow[]
  column: TColumn[]
  weekworkflow: TWeekworkflow[]
  week: TWeek[]
  nodeweek: TNodeweek[]
  nodelink: TNodelink[]
  node: TNode[]
  outcomeworkflow: TColumnworkflow[]
  outcome: TOutcome[]
  outcomenode: TOutcomenode[]
  outcomeoutcome: TOutcomeOutcome[]
  objectset: TObjectSet[]
  strategy: TStrategy[]
  //
  parent_workflow?: TParentWorkflow[]
  parent_node?: TParentNode[]
  outcomehorizontallink?: TOutcomeHorizontalLink[]
  child_workflow?: TChildWorkflow[]
}

export type RootOutcomeStateType = Pick<AppState, 'outcomeoutcome' | 'outcome'>

/*******************************************************
 * INDIVIDUALL REDUCER TYPES
 *******************************************************/
export type TOutcomenode = EOutcomenode

export type TOutcomeOutcome = EOutcomeOutcome

export type TOutcome = EOutcome

export type TColumn = EColumn & {
  lock?: Lock
}

export type TNode = ENode
export type TUser = EUser

export type TColumnworkflow = EOutcomeWorkflow & {
  outcome?: number
  no_drag?: boolean
  column?: number
}

export type TNodeweek = ENodeweek

export type TWeek = EWeek & {
  is_dropped?: boolean
}

export type TWeekworkflow = EWeekworkflow & {
  no_drag?: boolean
}

export type TOutcomeWorkflow = EOutcomeWorkflow

export type TWorkflow = EWorkflow & {
  lock?: boolean
  edit_count?: number
  type?: WorkflowType
  strategy_icon?: number
  DEFAULT_COLUMNS?: number[]
  DEFAULT_CUSTOM_COLUMN?: number
}

export type TNodelink = ENodelink

// @todo i think this is missing attributes
export type TObjectSet = EObjectSet & {
  hidden?: boolean // not sure if this is the same objectset
}

export type TStrategy = EStrategy
export type TParentWorkflow = any
export type TChildWorkflow = any
export type TOutcomeHorizontalLink = any
export type TParentNode = any
export type TDate = EDate

// ENUM
export enum NodeTypeDisplay {
  CourseNode = 'Course Node'
}
