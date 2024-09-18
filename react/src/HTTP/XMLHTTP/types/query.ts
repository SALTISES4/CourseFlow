import {
  WorkflowChildDataPackage,
  WorkflowDataPackage,
  WorkflowParentDataPackage
} from '@XMLHTTP/types'
import { ProjectViewDTO, WorkflowDetailViewDTO } from '@XMLHTTP/types/dto'
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
  maxLength: number | null
  helpText: string
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
  message: string
  error?: string
}

/*******************************************************
 * Page
 *******************************************************/
export type PageHomeQueryResp = {
  message: string
  dataPackage: {
    projects: ELibraryObject[]
    templates: ELibraryObject[]
  }
}

/*******************************************************
 * User
 *******************************************************/
export type CurrentUserQueryResp = {
  message: string
  dataPackage: {
    id: number
    firstName: string
    lastName: string
    userName: string
    language: string
  }
}

export type NotificationSettingsQueryResp = {
  message: string
  dataPackage: {
    formData: {
      receiveNotifications: boolean
    }
  }
}

export type NotificationSettingsUpdateQueryResp = {
  message: string
  dataPackage: {
    formData: {
      receiveNotifications: boolean
    }
  }
}

export type ProfileSettingsQueryResp = {
  message: string
  dataPackage: {
    formData: ProfileField[]
  }
}

/*******************************************************
 *  Notification
 *******************************************************/
export type NotificationQueryResp = {
  message: string
  dataPackage: {
    notifications: any
    unreadCount: number
  }
}

/*******************************************************
 * comment.ts
 *******************************************************/
export type CommentsForObjectQueryResp = {
  message: string
  dataPackage: EComment[]
}

/*******************************************************
 * create.ts
 *******************************************************/
export type AddTerminologyQueryResp = {
  message: string
  newDict: EObjectSet[]
}

/*******************************************************
 * duplication.ts
 *******************************************************/

export type DuplicateBaseItemQueryResp = {
  message: string
  newItem: ENewItem
  type: string
}

/*******************************************************
 * export_import.ts
 *******************************************************/

/*******************************************************
 * menu.ts
 *******************************************************/
export type PageLibraryQueryResp = {
  dataPackage: ELibraryObject[]
}

/*******************************************************
 * search.ts
 *******************************************************/
export type LibraryObjectsSearchQueryResp = {
  message: string
  dataPackage: {
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
  message: string
  author: EUser

  viewers: EUser[]
  commentors: EUser[]
  editors: EUser[]
  students: EUser[]

  published: boolean // why here, should move it
  publicView: boolean // why here, should move it
  cannotChange: number[] // what is
  saltiseUser: boolean // what is
  isTemplate: boolean // why here, should move it
}

export type UserListResp = {
  message: string
  dataPackage: {
    userList: EUser[]
  }
}

/*******************************************************
 * project.ts
 *******************************************************/
export type GetProjectByIdQueryResp = {
  message: string
  dataPackage: ProjectViewDTO
}

export type CreateProjectResp = {
  message: string
  dataPackage: {
    id: number
  }
}

/*******************************************************
 * workflow.ts
 *******************************************************/
export type GetWorkflowByIdQueryResp = {
  message: string
  dataPackage: WorkflowDetailViewDTO
}

export type WorkflowDataQueryResp = {
  message: string
  dataPackage: WorkflowDataPackage
}

export type WorkflowParentDataQueryResp = {
  message: string
  dataPackage: WorkflowParentDataPackage
}

export type WorkflowChildDataQueryResp = {
  message: string
  dataPackage: WorkflowChildDataPackage
}

// export type WorkflowContextQueryResp = {
//   message: string
//   dataPackage: WorkflowContextData
//   workflowId: number
// }

export type TargetProjectQueryResp = {
  message: string
  dataPackage: {
    ownedProjects: ESectionGroup
    editProjects: ESectionGroup
    deletedProjects?: ESectionGroup
  }
  workflowId: number
}

export type ProjectsForCreateQueryResp = {
  message: string
  dataPackage: ELibraryObject[]
}

export type ParentWorkflowInfoQueryResp = {
  message: string
  parentWorkflows: EWorkflow[]
}

export type WorkflowsForProjectQueryResp = {
  message: string
  dataPackage: EWorkflow[]
}

export type LinkedWorkflowMenuQueryResp = {
  message: string
  dataPackage: WorkflowGroupsDataPackage
  nodeId: number
}

export type GetWorkflowSelectQueryResp = {
  message: string
  dataPackage: WorkflowGroupsDataPackage
  projectId: number
}

export type GetWorkflowSelectMenuResp = {
  workflowId: number
}

/*******************************************************
 * QUERY COMPONENTS
 *******************************************************/
export type WorkflowGroupsDataPackage = {
  currentProject: ESectionGroup
  allPublished: ESectionGroup
}
