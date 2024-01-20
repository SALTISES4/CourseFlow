import { QueryPages, Workflow } from '@cfModule/types/common'
import { VERB } from '@cfModule/types/enum'
import { TWorkflow } from '@cfRedux/types/type'
import { DataPackage } from '@XMLHTTP/types'
import { ENewItem, ESection, EUser } from '@XMLHTTP/types/entity'

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
  parent_workflows: TWorkflow[]
}
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
  author: EUser
  viewers: EUser[]
  commentors: EUser[]
  editors: EUser[]
  students: EUser[]
  published: boolean
  public_view: boolean
  cannot_change: number[]
}

export type DuplicateBaseItemQueryResp = {
  action: VERB
  new_item: ENewItem
  type: string
}

export type AddTerminologyQueryResp = {
  action: VERB
  new_dict: any
}

export type UserListResp = {
  action: VERB
  user_list: EUser[]
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

export type WorkflowDataQueryResp = {
  action: VERB
  data_package: DataPackage
}
export type SuccessPost = {
  action: VERB
}

/*******************************************************
 * QUERY COMPONENTS
 *******************************************************/

export type AllPublished = {
  title: string
  sections: ESection[]
  emptytext: string
}

export type ToggleStrategyQueryResp = {
  action: VERB
}

export type GetWorkflowSelectMenuResp = {
  workflowID: number
}
