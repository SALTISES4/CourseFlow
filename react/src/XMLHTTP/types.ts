import { ObjectPermission, QueryPages, Workflow } from '@cfModule/types/common'

export type LibraryQueryResp = {
  data_package: Workflow[]
}

export type SearchAllObjectsQueryResp = {
  action: string
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
  action: string
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
  action: string
  new_item: NewItem
  type: string
}

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
}
