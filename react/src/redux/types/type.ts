import { Lock } from '@cf/types/common'
import { WorkflowType } from '@cf/types/enum'
import {
  EColumn,
  EDate,
  ENode,
  ENodelink,
  ENodeweek,
  EObjectSet,
  EOutcome,
  EOutcomeOutcome,
  EOutcomeWorkflow,
  EOutcomenode,
  EProject,
  EStrategy,
  EUser,
  EWeek,
  EWeekworkflow,
  EWorkflow
} from '@XMLHTTP/types/entity'
import {WorkflowPermission} from "@cf/utility/permissions";

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
  parentWorkflow?: TParentWorkflow[]
  parentNode?: TParentNode[]
  parentProject?: TProject
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
  noDrag?: boolean
  column?: number
}

export type TNodeweek = ENodeweek

export type TWeek = EWeek & {
  isDropped?: boolean
}

export type TWeekworkflow = EWeekworkflow & {
  noDrag?: boolean
}

export type TOutcomeWorkflow = EOutcomeWorkflow

export type TWorkflow = EWorkflow & {
  workflowPermission: WorkflowPermission
  lock?: boolean
  editCount?: number
  type?: WorkflowType
  strategy_icon?: number
  defaultColumns?: number[]
  defaultCustomColumn?: number
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
export type TProject = EProject

// ENUM
export enum NodeTypeDisplay {
  CourseNode = 'Course Node'
}
