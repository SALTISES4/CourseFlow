import { CfLock } from '@cf/types/common'
import { WorkflowPermission } from '@cf/utility/permissions'
import { OutcomesState } from '@cfRedux/slices/outcomes.slice'
import { SidebarState } from '@cf/features/sidebar/state/sidebar.slice'
import { RootState } from '@cfRedux/store'
import {
  EColumn,
  EComment,
  EDate,
  ENode,
  ENodelink,
  ENodesection,
  ENotification,
  EOutcome,
  EOutcomeOutcome,
  EOutcomeWorkflow,
  EOutcomenode,
  EProject,
  ESection,
  ESectionworkflow,
  EStrategy,
  ETag,
  EUser,
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
  section: TSection[]
  workflow: TWorkflow
  node: TNode[]
  strategy: TStrategy[]
}

export type AppState = {
  workspace: WorkspaceAppState
  // relations
  columnworkflow: TColumnworkflow[]
  sectionworkflow: TSectionworkflow[]
  nodesection: TNodesection[]
  outcomeworkflow: TColumnworkflow[]
  // outcomes
  outcome: TOutcome[]
  outcomenode: TOutcomenode[]
  outcomeoutcome: TOutcomeOutcome[]
  tags: TTag[]
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

export type RootOutcomeStateType = Pick<RootState, 'outcomeoutcome' | 'outcome'>

/*******************************************************
 * INDIVIDUAL REDUCER TYPES
 *******************************************************/
export type TUser = EUser & {
  userColour?: string
}

type LockableItem = {
  lock?: CfLock
}

export type TOutcome = EOutcome & LockableItem
export type TColumn = EColumn & LockableItem
export type TNode = ENode & LockableItem
export type TSection = ESection & LockableItem

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

export type TNodesection = ENodesection

export type TSectionworkflow = ESectionworkflow & {
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

export type TTag = ETag
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
