import { WorkflowType } from '@cfModule/types/enum'
import {
  EColumn,
  EColumnworkflow,
  ENode,
  ENodelink,
  ENodeweek,
  EOutcome,
  EOutcomenode,
  EOutcomeOutcome,
  EOutcomeWorkflow,
  EUser,
  EWeek,
  EWeekworkflow,
  EWorkflow
} from '@XMLHTTP/types/entity'
import { Lock } from '@cfModule/types/common'

export type AppState = {
  workflow: TWorkflow
  outcomeworkflow: TColumnworkflow[]
  columnworkflow: TColumnworkflow[]
  column: TColumn[]
  weekworkflow: TWeekworkflow[]
  week: TWeek[]
  nodeweek: TNodeweek[]
  node: TNode[]
  outcomenode: TOutcomenode[]
  nodelink: TNodelink[]
  parent_workflow: TParentWorkflow[]
  parent_node: TParentNode[]
  outcomehorizontallink: TOutcomeHorizontalLink[]
  child_workflow: TChildWorkflow[]
  strategy: TStrategy[]
  objectset: TObjectSet[]
  outcomeoutcome: TOutcomeOutcome[]
  outcome: TOutcome[]
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

export type TColumnworkflow = EColumnworkflow & {
  outcome?: number
  no_drag?: boolean
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
  DEFAULT_COLUMNS: number[]
  DEFAULT_CUSTOM_COLUMN: number
}

export type TNodelink = ENodelink

// @todo i think this is missing attributes
export type TObjectSet = {
  title: string
  hidden?: boolean // not sure if this is the same objectset
  id?: number // not sure if this is the same objectset
  term?: any // not sure if this is the same objectset
}

export type TParentWorkflow = any
export type TStrategy = any
export type TChildWorkflow = any
export type TOutcomeHorizontalLink = any
export type TParentNode = any
// ENUM
export enum NodeTypeDisplay {
  CourseNode = 'Course Node'
}
