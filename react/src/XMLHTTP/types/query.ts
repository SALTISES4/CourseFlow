import { Discipline, QueryPages, Workflow } from '@cfModule/types/common'
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
  EUser,
  EComment,
  EObjectSet,
  ESectionGroup,
  ESectionObject,
} from '@XMLHTTP/types/entity'
import { ProjectViewDTO } from '@cfPages/ProjectDetail/types'
import {WorkflowDetailViewDTO} from "@cfPages/Workspace/Workflow/types";

/*******************************************************
 * Primitives
 *******************************************************/
type FieldOption = {
  label: string
  value: string
}

export type ProfileField = {
  name: string
  label: string
  type: string
  required: boolean
  options: FieldOption[] | null
  max_length: number | null
  help_text: string
  value: string | number
}

/*******************************************************
 * Page
 *******************************************************/
export type PageHomeQueryResp = {
  action: VERB
  data: {
    projects: Workflow[]
    templates: Workflow[]
    isTeacher: boolean
  }
}

export type PageExploreQueryResp = {
  action: VERB
  data: {
    initial_workflows: Workflow[]
    initial_pages: QueryPages
    disciplines: Discipline[]
    user_id: number
  }
}

/*******************************************************
 * User
 *******************************************************/
export type NotificationSettingsQueryResp = {
  action: VERB
  data_package: {
    formData: {
      receiveNotifications: boolean
    }
  }
}

export type NotificationSettingsUpdateQueryResp = {
  action: VERB
  data_package: {
    formData: {
      receiveNotifications: boolean
    }
  }
}

export type ProfileSettingsQueryResp = {
  action: VERB
  data_package: {
    formData: ProfileField[]
  }
}

/*******************************************************
 *  Notification
 *******************************************************/
export type NotificationQueryResp = {
  action: VERB
  data: {
    notifications: any
    unreadCount: number
  }
}

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

export type DisciplineQueryResp = {
  action: VERB
  data_package: Workflow[]
}

/*******************************************************
 * search.ts
 *******************************************************/

export type LibraryObjectsSearchQueryResp = {
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
  saltise_user: boolean
  is_template: boolean
}

export type UserListResp = {
  action: VERB
  user_list: EUser[]
}

/*******************************************************
 * project.ts
 *******************************************************/
export type GetProjectByIdQueryResp = {
  action: VERB
  data_package: ProjectViewDTO
}

/*******************************************************
 * workflow.ts
 *******************************************************/
export type GetWorkflowByIdQueryResp = {
  action: VERB
  data_package: WorkflowDetailViewDTO
}

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

export type ProjectsForCreateQueryResp = {
  action: VERB
  data_package: ESectionObject[]
}

export type ParentWorkflowInfoQueryResp = {
  action: VERB
  parent_workflows: Workflow[]
}

export type WorkflowsForProjectQueryResp = {
  action: VERB
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
