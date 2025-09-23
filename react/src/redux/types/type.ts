import { CfLock } from '@cf/types/common'
import { WorkflowPermission } from '@cf/utility/permissions'
import { OutcomesState } from '@cfRedux/slices/outcomes.slice'
import { SidebarState } from '@cfRedux/slices/sidebar.slice'
import {
  EColumn,
  EComment,
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

// so lock is not persisted
// but instead it's broadcast via emitter
// obviously that won't, but keep the lockable interface for now
//

export type WorkspaceAppState = {
  project?: TProject
  nodelink: TNodelink[]
  column: TColumn[]
  week: TWeek[]
  workflow: TWorkflow
  node: TNode[]
  strategy: TStrategy[]
  objectSet: TObjectSet[]
}

export type AppState = {
  workspace: WorkspaceAppState
  // relations
  columnworkflow: TColumnworkflow[]
  weekworkflow: TWeekworkflow[]
  nodeweek: TNodeweek[]
  outcomeworkflow: TColumnworkflow[]
  // outcomes
  outcome: TOutcome[]
  outcomenode: TOutcomenode[]
  outcomeoutcome: TOutcomeOutcome[]
  objectSet: TObjectSet[]
  //
  sidebar: SidebarState
  //
  parentWorkflow?: TParentWorkflow[]
  parentNode?: TParentNode[]
  outcomehorizontallink?: TOutcomeHorizontalLink[]
  childWorkflow?: TChildWorkflow[]

  // temporary, joined outcomes
  outcomes: OutcomesState
}

export type RootOutcomeStateType = Pick<AppState, 'outcomeoutcome' | 'outcome'>

/*******************************************************
 * INDIVIDUAL REDUCER TYPES
 *******************************************************/
export type TUser = EUser & {
  userColour?: string
}

type LockableItem = {
  lock?: CfLock
}

type ExpandableItem = {
  isDropped?: boolean
}

export type TOutcome = EOutcome & LockableItem
export type TColumn = EColumn & LockableItem
export type TNode = ENode & LockableItem & ExpandableItem
export type TWeek = EWeek & LockableItem & ExpandableItem

/*******************************************************
 * MORE RELAIONS
 *******************************************************/
export type TOutcomenode = EOutcomenode
export type TOutcomeOutcome = EOutcomeOutcome
export type TColumnworkflow = EOutcomeWorkflow & {
  outcome?: number
  noDrag?: boolean
  column?: number
}

export type TNodeweek = ENodeweek

export type TWeekworkflow = EWeekworkflow & {
  noDrag?: boolean
}

export type TOutcomeWorkflow = EOutcomeWorkflow

export type TWorkflow = EWorkflow & {
  workflowPermissions: WorkflowPermission
  lock?: CfLock
}

export type TNodelink = ENodelink & {
  lock?: CfLock
}

// @todo i think this is missing attributes
export type TObjectSet = EObjectSet & {
  hidden?: boolean
}

export type TStrategy = EStrategy
export type TParentWorkflow = any
export type TChildWorkflow = any
export type TOutcomeHorizontalLink = any
export type TParentNode = any
export type TDate = EDate
export type TProject = EProject
export type TComment = EComment
export type TNotification = ENotification & {
  url: string
}

// ENUM
export enum NodeTypeDisplay {
  CourseNode = 'Course Node'
}
