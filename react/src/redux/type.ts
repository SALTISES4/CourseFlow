import ChildWorkflow from '@cfRedux/reducers/childWorkflow'
import { WorkflowType } from '@cfModule/types/enum'

export type AppState = {
  workflow: Workflow
  outcomeworkflow: Columnworkflow[]
  columnworkflow: Columnworkflow[]
  column: Column[]
  weekworkflow: Weekworkflow[]
  week: Week[]
  nodeweek: Nodeweek[]
  node: NodeType[]
  outcomenode: Outcomenode[]
  nodelink: Nodelink[]
  parent_workflow: ParentWorkflow[]
  parent_node: ParentNode[]
  outcomehorizontallink: OutcomeHorizontalLink[]
  child_workflow: ChildWorkflow[]
  strategy: Strategy[]
  objectset: ObjectSet[]
  outcomeoutcome: OutcomeOutcome[]
  outcome: Outcome[]
}

export type RootOutcomeStateType = Pick<AppState, 'outcomeoutcome' | 'outcome'>

/*******************************************************
 * INDIVIDUALL REDUCER TYPES
 *******************************************************/
export type Outcomenode = {
  node: number
  outcome: number
  rank: number
  id: number
  degree: number
}

export type OutcomeOutcome = {
  parent: number
  child: number
  rank: number
  id: number
}

export type Outcome = {
  id: number
  deleted: boolean
  deleted_on: Date | string
  title: null
  code: null
  description: null
  child_outcome_links: number[]
  outcome_horizontal_links: any[]
  outcome_horizontal_links_unique: any[]
  depth: number
  type: string
  comments: any[]
  sets: any[]
  outcomeworkflow: number
  is_dropped: boolean
}

export type Column = {
  deleted: boolean
  deleted_on: string
  id: number
  title: null
  icon: null
  column_type: number
  column_type_display: string
  colour: null
  visible: boolean
  comments: any[]
}

export type Columnworkflow = {
  workflow: number
  rank: number
  id: number
  column?: number
  outcome?: number
  no_drag?: boolean
}

export type NodeType = {
  deleted: boolean
  deleted_on: string
  id: number
  title: null
  description: null
  column: number
  columnworkflow: number
  context_classification: number
  task_classification: number
  outcomenode_set: any[]
  outcomenode_unique_set: any[]
  outgoing_links: any[]
  node_type: number
  node_type_display: NodeTypeDisplay
  has_autolink: boolean
  time_units: number
  time_required: null
  ponderation_theory: number
  ponderation_practical: number
  ponderation_individual: number
  time_general_hours: number
  time_specific_hours: number
  represents_workflow: boolean
  linked_workflow: null
  linked_workflow_data: null
  comments: any[]
  sets: any[]
  has_assignment: boolean
  is_dropped?: boolean
}

export type Nodeweek = {
  added_on: Date
  week: number
  node: number
  rank: number
  id: number
}

export type Week = {
  id: number
  deleted: boolean
  deleted_on: string
  title: null
  description: null
  default: boolean
  nodeweek_set: number[]
  week_type: number
  week_type_display: string
  is_strategy: boolean
  strategy_classification: number
  comments: any[]
  is_dropped: boolean
}

export type Weekworkflow = {
  id: number
  workflow: number
  week: number
  rank: number
  week_type: number
  no_drag?: boolean
}

export type OutcomeWorkflow = {
  workflow: number
  outcome: number
  rank: number
  id: number
}

export type Workflow = {
  id: number
  deleted: boolean
  deleted_on: string
  title: string
  description: string
  code: null
  author: string
  author_id: number
  created_on: string
  last_modified: string
  columnworkflow_set: number[]
  weekworkflow_set: number[]
  is_original: boolean
  parent_workflow: null
  outcomes_type: number
  outcomes_sort: number
  outcomeworkflow_set: any[]
  is_strategy: boolean
  published: boolean
  type: WorkflowType
  DEFAULT_COLUMNS: number[]
  DEFAULT_CUSTOM_COLUMN: number
  time_required: null
  time_units: number
  ponderation_theory: number
  ponderation_practical: number
  ponderation_individual: number
  time_general_hours: number
  time_specific_hours: number
  favourite: boolean
  condensed: boolean
  importing: boolean
  public_view: boolean
  url: string
  lock?: boolean
}

/*******************************************************
 * NEED TYPING
 *******************************************************/
export type Nodelink = {
  deleted: boolean
  deleted_on: string
  id: number
  title: null
  source_node: number
  target_node: number
  source_port: number
  target_port: number
  dashed: boolean
  text_position: number
}

export type ObjectSet = {
  title: string
}

export type ParentWorkflow = any
export type Strategy = any
export type ChildWorkflow = any
export type OutcomeHorizontalLink = any

// ENUM
export enum NodeTypeDisplay {
  CourseNode = 'Course Node'
}
