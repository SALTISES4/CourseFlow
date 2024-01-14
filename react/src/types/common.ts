import { WorkflowType } from '@cfModule/types/enum'

export type ToDefine = any

export interface Workflow {
  id: number
  author: string
  created_on: string
  deleted: boolean
  description: string | null
  favourite: boolean
  has_liveproject: boolean
  is_linked: boolean
  is_owned: boolean
  is_strategy: boolean
  is_visible: boolean
  last_modified: string
  object_permission: ObjectPermission
  project_title: null
  published: boolean
  title: string
  type: WorkflowType
  workflow_count: null
}

export type ObjectPermission = {
  permission_type: number
  last_viewed: Date
  role_type: number
}

export type QueryPages = {
  total_results: number
  page_count: number
  current_page: number
  results_per_page: number
}

export type Discipline = {
  id: number
  title: string
}

export enum VERB {
  POSTED = 'posted',
  ERROR = 'error'
}
