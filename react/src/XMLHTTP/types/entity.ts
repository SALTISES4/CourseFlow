import { ObjectPermission } from '@cfModule/types/common'
import { NodeTypeDisplay } from '@cfRedux/type'

export type EColumn = {
  colour: null
  column_type: number
  column_type_display: string
  comments: any[]
  deleted: boolean
  deleted_on: TDate
  icon: string | null
  id: number
  title: null
  visible: boolean
}

export type EWeek = {
  deleted: boolean
  deleted_on: TDate
  id: number
  title: null
  description: null
  default: boolean
  nodeweek_set: any[]
  week_type: number
  week_type_display: string
  is_strategy: boolean
  strategy_classification: number
  comments: any[]
}

export type EOutcome = {
  id: number
  deleted: boolean
  deleted_on: TDate
  title: string
  code: string
  description: string
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

export type EColumnworkflow = {
  workflow: number
  column: number
  rank: number
  id: number
}

export type EWorkflow = {
  author: string
  author_id: number | null
  code: null
  columnworkflow_set: number[]
  condensed: boolean
  created_on: TDate
  deleted: boolean
  deleted_on: TDate
  description: null | string
  favourite: boolean
  id: number
  importing: boolean
  is_original: boolean
  is_strategy: boolean
  last_modified: TDate
  outcomes_sort: number
  outcomes_type: number
  outcomeworkflow_set: any[]
  parent_workflow: null
  ponderation_individual: number
  ponderation_practical: number
  ponderation_theory: number
  public_view: boolean
  published: boolean
  time_general_hours: number
  time_required: null
  time_specific_hours: number
  time_units: number
  title: string
  url: string
  weekworkflow_set: number[]
  // @todo check where this is defined
  edit_count?: number
}

export type EWeekworkflow = {
  workflow: number
  week: number
  rank: number
  id: number
  week_type: number
}

export type ENewItem = {
  deleted: boolean
  id: number
  created_on: TDate
  last_modified: string
  type: string
  favourite: boolean
  is_owned: boolean
  is_strategy: boolean
  published: boolean
  author: string
  title: string
  description: string
  project_title: null
  object_permission: ObjectPermission
  has_liveproject: boolean
  workflow_count: number
  is_linked: boolean
  is_visible: boolean
}

export type EUser = {
  id: number
  username: string
  first_name: string
  last_name: string
  user_colour?: string
}

export type ENode = {
  deleted: boolean
  deleted_on: TDate
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
  time_required: any | null
  ponderation_theory: number
  ponderation_practical: number
  ponderation_individual: number
  time_general_hours: number
  time_specific_hours: number
  represents_workflow: boolean
  linked_workflow: any
  linked_workflow_data: any
  comments: any[]
  sets: any[]
  has_assignment: boolean
  is_dropped?: boolean
}

export type ENodelink = {
  deleted: boolean
  deleted_on: TDate
  id: number
  title: null
  source_node: number
  target_node: number
  source_port: number
  target_port: number
  dashed: boolean
  text_position: number
}

export type EOutcomeWorkflow = {
  workflow: number
  outcome: number
  rank: number
  id: number
}

export type ENodeweek = {
  added_on: TDate
  week: number
  node: number
  rank: number
  id: number
}

export type EOutcomenode = {
  node: number
  outcome: number
  rank: number
  id: number
  degree: number
}

export type EOutcomeOutcome = {
  parent: number
  child: number
  rank: number
  id: number
}

export type ESection = {
  title: string
  object_type: string
  is_strategy: boolean
  objects: ESectionObject[]
}

export type ESectionObject = {
  deleted: boolean
  id: number
  created_on: TDate
  last_modified: TDate
  type: string
  favourite: boolean
  is_owned: boolean
  is_strategy: boolean
  published: boolean
  author: string
  title: string
  description: string
  project_title: string
  object_permission: ObjectPermission
  has_liveproject: boolean
  workflow_count: null
  is_linked: boolean
  is_visible: boolean
}

export type TDate = string
