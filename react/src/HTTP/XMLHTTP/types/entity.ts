import { Discipline, ObjectPermission, ObjectSet } from '@cf/types/common'
import { LibraryObjectType, WorkflowType } from '@cf/types/enum'
import { NodeTypeDisplay } from '@cfRedux/types/type'

export type EDate = string
export type EDiscipline = {
  id: number
  title: string
}

export type EComment = {
  id: number
  user: EUser
  created_on: EDate
  text: string
}

export type EColumn = {
  id: number
  deleted: boolean
  deleted_on: EDate
  title: null

  colour: null
  column_type: number
  column_type_display: string
  comments: any[]
  icon: string | null
  visible: boolean
}

export type EWeek = {
  id: number
  deleted: boolean
  deleted_on: EDate
  title: null
  description: null

  default: boolean
  nodeweek_set: number[]
  week_type: number
  week_type_display: string
  is_strategy: boolean
  strategy_classification: number
  comments: any[]
}

export type EOutcome = {
  id: number
  deleted: boolean
  deleted_on: EDate
  title: string
  description: string

  code: string
  child_outcome_links: number[]
  outcome_horizontal_links: number[]
  outcome_horizontal_links_unique: number[]
  depth: number
  type: string
  comments: any[]
  sets: number[]
  outcomeworkflow: number
  is_dropped: boolean
}

export type EWorkflow = {
  id: number
  author: string
  deleted: boolean
  created_on: Date
  last_modified: Date
  title: string
  favourite: boolean
  published: boolean
  description: null | string

  author_id: number | null
  code: null
  columnworkflow_set: number[]
  condensed: boolean
  deleted_on: EDate
  importing: boolean
  is_original: boolean
  is_strategy: boolean
  outcomes_sort: number
  outcomes_type: number
  outcomeworkflow_set: any[]
  parent_workflow: null
  ponderation_individual: number
  ponderation_practical: number
  ponderation_theory: number
  public_view: boolean

  time_general_hours: number
  time_required: null
  time_specific_hours: number
  time_units: number

  url: string
  weekworkflow_set: number[]
  // @todo check where this is defined
  edit_count?: number
}

export type EProject = {
  author: string
  author_id: number
  created_on: Date
  deleted: boolean
  deleted_on: Date
  description: string
  disciplines: number[]
  favourite: boolean
  id: number
  last_modified: string
  object_permission: ObjectPermission
  object_sets: ObjectSet[]
  published: boolean
  title: string
  // TODO: identify these really are the types / convert to enum?
  type: 'project' | 'program' | 'course' | 'activity'
  workflowproject_set: number[]
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
  created_on: EDate
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
  deleted_on: EDate
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
  deleted_on: EDate
  id: number
  title: string | null
  source_node: number
  target_node: number
  source_port: number
  target_port: number
  dashed: boolean
  text_position: number
}

export type EOutcomeWorkflow = {
  id: number
  rank: number
  workflow: number
  outcome: number
}
export type EColumnworkflow = EOutcomeWorkflow

export type ENodeweek = {
  added_on: EDate
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

export type EOutcomeHorizontalLink = {
  outcome: number
  parent_outcome: number
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

export type ESectionGroup = {
  title: string
  sections: ESection[]
  add: boolean
  duplicate: string
  emptytext: string
}

export type ESection = {
  title: string
  object_type: string
  is_strategy: boolean
  objects: ELibraryObject[]
}

export type ELibraryObject = {
  id: number
  author: string
  deleted: boolean
  created_on: EDate
  last_modified: EDate
  title: string
  favourite: boolean
  published: boolean
  description: string

  type: LibraryObjectType
  is_owned: boolean
  is_strategy: boolean
  project_title: string
  object_permission: ObjectPermission
  has_liveproject: boolean
  workflow_count: number
  is_linked: boolean
  is_visible: boolean
  is_template: boolean
}

export type EObjectSet = {
  title: string
  id: number
  translation_plural: string
  term: string
}

export type EStrategy = any
export type EParentWorkflow = any
export type EChildWorkflow = any
