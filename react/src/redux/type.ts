export type AppState = {
  workflow: Workflow
  outcomeworkflow: any[]
  columnworkflow: Columnworkflow[]
  column: Column[]
  weekworkflow: Weekworkflow[]
  week: Week[]
  nodeweek: Nodeweek[]
  node: Node[]
  nodelink: any[]
  outcome: any[]
  outcomeoutcome: any[]
  outcomenode: any[]
  parent_workflow: any[]
  parent_node: any[]
  outcomehorizontallink: any[]
  child_workflow: any[]
  strategy: any[]
  saltise_strategy: any[]
  objectset: any[]
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
  column: number
  rank: number
  id: number
}

export type Node = {
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
  node_type_display: string
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
  week: number
  node: number
  added_on: Date
  rank: number
  id: number
}

export type Week = {
  deleted: boolean
  deleted_on: string
  id: number
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
  workflow: number
  week: number
  rank: number
  id: number
  week_type: number
}

export type Workflow = {
  deleted: boolean
  deleted_on: string
  id: number
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
  type: string
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
}
