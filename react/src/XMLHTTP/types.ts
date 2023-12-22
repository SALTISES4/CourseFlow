export type LibraryQueryResp = {
  data_package: Workflow[]
}

export type Workflow = {
  id: number
  deleted: boolean
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

type ObjectPermission = {
  permission_type: number
  last_viewed: Date
  role_type: number
}
