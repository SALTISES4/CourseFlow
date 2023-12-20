export type ExploreViewContextDataDTO = {
  initial_workflows: InitialWorkflow[]
  initial_pages: InitialPages
  disciplines: Discipline[]
  user_id: number
}

export type Discipline = {
  id: number
  title: string
}

export type InitialPages = {
  total_results: number
  page_count: number
  current_page: number
  results_per_page: number
}

export type InitialWorkflow = {
  deleted: boolean
  id: number
  created_on: string
  last_modified: string
  type: Type
  favourite: boolean
  is_owned: boolean
  is_strategy: boolean
  published: boolean
  author: string
  title: string
  description: null
  project_title: null
  object_permission: ObjectPermission
  has_liveproject: boolean
  workflow_count: null
  is_linked: boolean
  is_visible: boolean
}

export type ObjectPermission = {
  permission_type: number
  last_viewed: null
  role_type: number
}

export enum Type {
  Activity = 'activity'
}
