import { QueryPages, Workflow } from '@cfModule/types/common'
import { VERB } from '@cfModule/types/enum'
import { TWorkflow } from '@cfRedux/types/type'
import {
  WorkflowDataPackage,
  WorkflowParentDataPackage,
  WorkflowChildDataPackage,
  WorkflowContextData
} from '@XMLHTTP/types'
import {
  ENewItem,
  ESection,
  EUser,
  EComment,
  EObjectSet,
  ESectionGroup
} from '@XMLHTTP/types/entity'

/*******************************************************
 * EmptyPostResp
 * Used for all queries that do not export
 * a response beyond confirmation that the
 * POST has been sucessfully recieved and
 * processed
 *******************************************************/
export type EmptyPostResp = {
  action: VERB
  error?: string
}

/*******************************************************
 * comment.ts
 *******************************************************/

export type CommentsForObjectQueryResp = {
  action: VERB
  data_package: EComment[]
}

/*******************************************************
 * create.ts
 *******************************************************/

export type AddTerminologyQueryResp = {
  action: VERB
  new_dict: EObjectSet[]
}

/*******************************************************
 * delete.ts
 *******************************************************/

/*******************************************************
 * duplication.ts
 *******************************************************/

export type DuplicateBaseItemQueryResp = {
  action: VERB
  new_item: ENewItem
  type: string
}

/*******************************************************
 * export_import.ts
 *******************************************************/

/*******************************************************
 * menu.ts
 *******************************************************/

export type LibraryQueryResp = {
  data_package: Workflow[]
}

export type FavouritesQueryResp = {
  action: VERB
  data_package: Workflow[]
}

/*******************************************************
 * search.ts
 *******************************************************/

export type SearchAllObjectsQueryResp = {
  action: VERB
  workflow_list: Workflow[]
  pages: QueryPages
}

/*******************************************************
 * sharing.ts
 *******************************************************/

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

export type UserListResp = {
  action: VERB
  user_list: EUser[]
}

/*******************************************************
 * update.ts
 *******************************************************/

/*******************************************************
 * workflow.ts
 *******************************************************/

export type WorkflowDataQueryResp = {
  action: VERB
  data_package: WorkflowDataPackage
}

export type WorkflowParentDataQueryResp = {
  action: VERB
  data_package: WorkflowParentDataPackage
}

export type WorkflowChildDataQueryResp = {
  action: VERB
  data_package: WorkflowChildDataPackage
}

export type WorkflowContextQueryResp = {
  action: VERB
  data_package: WorkflowContextData
  workflow_id: number
}

export type TargetProjectQueryResp = {
  action: VERB
  data_package: {
    owned_projects: ESectionGroup
    edit_projects: ESectionGroup
    deleted_projects?: ESectionGroup
  }
  workflow_id: number
}

export type ParentWorkflowInfoQueryResp = {
  action: VERB
  parent_workflows: Workflow[]
}

export type WorkflowsForProjectQueryResp = {
  data_package: Workflow[]
}

export type LinkedWorkflowMenuQueryResp = {
  action: VERB
  data_package: WorkflowGroupsDataPackage
  node_id: number
}

export type GetWorkflowSelectQueryResp = {
  action: VERB
  data_package: WorkflowGroupsDataPackage
  project_id: number
}

export type GetWorkflowSelectMenuResp = {
  workflowID: number
}

/*******************************************************
 * QUERY COMPONENTS
 *******************************************************/

export type WorkflowGroupsDataPackage = {
  current_project: ESectionGroup
  all_published: ESectionGroup
}
