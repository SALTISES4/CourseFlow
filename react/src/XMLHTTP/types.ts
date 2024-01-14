import {
  ObjectPermission,
  QueryPages,
  VERB,
  Workflow
} from '@cfModule/types/common'

import {
  Nodelink,
  NodeType,
  Nodeweek,
  Outcome,
  Outcomenode,
  OutcomeOutcome,
  OutcomeWorkflow
} from '@cfRedux/type'

export type LibraryQueryResp = {
  data_package: Workflow[]
}

export type SearchAllObjectsQueryResp = {
  action: VERB
  workflow_list: Workflow[]
  pages: QueryPages
}

export type HomeQueryResp = {
  favourites: Workflow[]
  projects: Workflow[]
}

export type WorkflowsForProjectQueryResp = {
  data_package: Workflow[]
}

export type UsersForObjectQueryResp = {
  action: VERB
  author: User
  viewers: any[]
  commentors: any[]
  editors: User[]
  students: any[]
  published: boolean
  public_view: boolean
  cannot_change: number[]
}

export type DuplicateBaseItemQueryResp = {
  action: VERB
  new_item: NewItem
  type: string
}

export type AddTerminologyQueryResp = {
  action: VERB
  new_dict: any
}

export type UserListResp = {
  action: VERB
  user_list: User[]
}
export type RestoreSelfQueryResp = {
  action: VERB
}
export type DeleteSelfQueryResp = {
  action: VERB
}
export type DuplicateSelfQueryResp = {
  action: VERB
}
export type InsertChildQueryResp = {
  action: VERB
}
export type InsertSiblingQueryResp = {
  action: VERB
}

export type NewNodeQueryResp = {
  action: VERB
}
export type AddStrategyQueryResp = {
  action: VERB
}

export type FavouritesQueryResp = {
  action: VERB
  data_package: any
}

export type UpdateOutcomenodeDegreeResp = {
  action: VERB
  data_package: any
}

export type CommentsForObjectQueryResp = any
export type UpdateValueInstantQueryResp = any
/*******************************************************
 *
 *******************************************************/
export type WorkflowDataQueryResp = {
  action: VERB
  data_package: DataPackage
}

/*******************************************************
 *
 *******************************************************/

export type DataPackage = {
  workflow: WorkflowDetailed
  columnworkflow: Columnworkflow[]
  column: Column[]
  weekworkflow: Weekworkflow[]
  week: Week[]
  nodeweek: Nodeweek[]
  nodelink: Nodelink[]
  node: NodeType[]
  outcomeworkflow: OutcomeWorkflow[]
  outcome: Outcome[]
  outcomenode: Outcomenode[]
  saltise_strategy: WorkflowDetailed[]
  outcomeoutcome: OutcomeOutcome[]
  // @todo still missing types
  objectset: any[]
  strategy: any[]
  unread_comments: any[]
}

export type Column = {
  deleted: boolean
  deleted_on: CreatedOn
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

interface WorkflowDetailed {
  deleted: boolean
  deleted_on: CreatedOn
  id: number
  title: string
  description: null | string
  code: null
  author: string
  created_on: CreatedOn
  last_modified: CreatedOn
  columnworkflow_set: number[]
  weekworkflow_set: number[]
  is_original: boolean
  parent_workflow: null
  outcomes_type: number
  outcomes_sort: number
  outcomeworkflow_set: any[]
  author_id: number | null
  is_strategy: boolean
  strategy_icon?: number
  published: boolean
  time_required: null
  time_units: number
  ponderation_theory: number
  ponderation_practical: number
  ponderation_individual: number
  time_general_hours: number
  time_specific_hours: number
  edit_count?: number
  favourite: boolean
  condensed: boolean
  importing: boolean
  public_view: boolean
  url: string
  type?: string
  DEFAULT_COLUMNS?: number[]
}

export type Week = {
  deleted: boolean
  deleted_on: CreatedOn
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

export type Weekworkflow = {
  workflow: number
  week: number
  rank: number
  id: number
  week_type: number
}

/*******************************************************
 *
 *******************************************************/

export type NewItem = {
  deleted: boolean
  id: number
  created_on: string
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

export type User = {
  id: number
  username: string
  first_name: string
  last_name: string
  user_colour?: string
}

type CreatedOn = string

export type SuccessPost = {
  action: VERB
}
