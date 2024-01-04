import { ObjectPermission, VERB } from '@cfModule/types/common'

/*******************************************************
 * LinkedWorkflowMenuQueryResp
 *******************************************************/
export type LinkedWorkflowMenuQueryResp = {
  action: VERB
  data_package: LinkedWorkDataPackage
  node_id: number
}

export type LinkedWorkDataPackage = {
  current_project: AllPublished
  all_published: AllPublished
}

export type AllPublished = {
  title: string
  sections: Section[]
  emptytext: string
}

export type Section = {
  title: string
  object_type: string
  is_strategy: boolean
  objects: SectionObject[]
}

export type SectionObject = {
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
  project_title: string
  object_permission: ObjectPermission
  has_liveproject: boolean
  workflow_count: null
  is_linked: boolean
  is_visible: boolean
}
