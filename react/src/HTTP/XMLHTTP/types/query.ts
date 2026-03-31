import { CfObjectType } from '@cf/types/enum'
import {
  EComment,
  ELibraryObject,
  ENewItem,
  ESectionGroup,
  ETag,
  EWorkflow
} from '@XMLHTTP/types/entity'

/*******************************************************
 * Primitives
 *******************************************************/
type FieldOption = {
  label: string
  value: string
}

export type FormField = {
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
 * comment.ts
 *******************************************************/
export type CommentsForObjectQueryResp = {
  message: string
  dataPackage: EComment[]
}

export type CommentsForObjectQueryArgs = {
  objectid: string
  objectType: CfObjectType
}

/*******************************************************
 * create.ts
 *******************************************************/
export type AddTerminologyQueryResp = {
  message: string
  newDict: ETag[]
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
 * workflow.ts
 *******************************************************/
// export type GetWorkflowByIdQueryResp = {
//   message: string
//   dataPackage: WorkflowDetailViewDTO
// }

// export type WorkflowContextQueryResp = {
//   message: string
//   dataPackage: WorkflowContextData
//   workflowid: string
// }

export type TargetProjectQueryResp = {
  message: string
  dataPackage: {
    ownedProjects: ESectionGroup
    editProjects: ESectionGroup
    deletedProjects?: ESectionGroup
  }
  workflowid: string
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
  nodeid: string
}

export type GetWorkflowSelectQueryResp = {
  message: string
  dataPackage: WorkflowGroupsDataPackage
  projectid: string
}

export type GetWorkflowSelectMenuResp = {
  workflowid: string
}

/*******************************************************
 * QUERY COMPONENTS
 *******************************************************/
export type WorkflowGroupsDataPackage = {
  currentProject: ESectionGroup
  allPublished: ESectionGroup
}
