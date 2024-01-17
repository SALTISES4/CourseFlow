import { ObjectPermission, VERB } from '@cfModule/types/common'
import { Workflow } from '@cfRedux/type'

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

export type ParentWorkflowInfoQueryResp = {
  action: VERB
  parent_workflows: Workflow[]
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

export type ToggleStrategyQueryResp = {
  action: VERB
}

export type GetWorkflowSelectMenuResp = {
  workflowID: number
}
