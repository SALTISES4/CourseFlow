import { Lock } from '@cf/types/common'
import { WorkflowPermission } from '@cf/utility/permissions'
import {
  EColumn,
  EDate,
  ENode,
  ENodelink,
  ENodeweek,
  ENotification,
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

// @todo look into where lock comes from
export type TOutcome = EOutcome & {
  lock?: Lock
}

// @todo look into where lock comes from
export type TColumn = EColumn & {
  lock?: Lock
}

// @todo look into where lock comes from
export type TNode = ENode & {
  lock?: Lock
}
export type TUser = EUser & {
  userColour?: string
}

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
  workflowPermissions: WorkflowPermission
  lock?: boolean
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
export type TNotification = ENotification & {
  url: string
}

// ENUM
export enum NodeTypeDisplay {
  CourseNode = 'Course Node'
}
