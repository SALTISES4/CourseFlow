import { Discipline } from '@cf/types/common'
import { VERB } from '@cf/types/enum'
import { ProjectViewDTO } from '@cfPages/ProjectDetail/types'
import { WorkflowDetailViewDTO } from '@cfPages/Workspace/Workflow/types'
import {
  WorkflowChildDataPackage,
  WorkflowContextData,
  WorkflowDataPackage,
  WorkflowParentDataPackage
} from '@XMLHTTP/types'
import {
  EComment,
  ELibraryObject,
  ENewItem,
  EObjectSet,
  ESectionGroup,
  EUser,
  EWorkflow
} from '@XMLHTTP/types/entity'

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
 * Page
 *******************************************************/
export type PageHomeQueryResp = {
  action: VERB
  data_package: {
    projects: ELibraryObject[]
    templates: ELibraryObject[]
  }
}

export type PageExploreQueryResp = {
  action: VERB
  data_package: {
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
  data_package: {
    notifications: any
    unreadCount: number
  }
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
export type PageLibraryQueryResp = {
  data_package: ELibraryObject[]
}

/*******************************************************
 * search.ts
 *******************************************************/
export type LibraryObjectsSearchQueryResp = {
  action: VERB
  data_package: {
    results: ELibraryObject[]
    meta: {
      count: number
      pageCount: number
    }
  }
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

  published: boolean // why here, should move it
  public_view: boolean // why here, should move it
  cannot_change: number[] // what is
  saltise_user: boolean // what is
  is_template: boolean // why here, should move it
}

export type UserListResp = {
  action: VERB
  data_package: {
    user_list: EUser[]
  }
}

/*******************************************************
 * project.ts
 *******************************************************/
export type GetProjectByIdQueryResp = {
  action: VERB
  data_package: ProjectViewDTO
}

export type CreateProjectResp = {
  action: VERB
  data_package: {
    id: number
  }
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
  data_package: ELibraryObject[]
}

export type ParentWorkflowInfoQueryResp = {
  action: VERB
  parent_workflows: EWorkflow[]
}

export type WorkflowsForProjectQueryResp = {
  action: VERB
  data_package: EWorkflow[]
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
  workflowId: number
}

/*******************************************************
 * QUERY COMPONENTS
 *******************************************************/
export type WorkflowGroupsDataPackage = {
  current_project: ESectionGroup
  all_published: ESectionGroup
}
