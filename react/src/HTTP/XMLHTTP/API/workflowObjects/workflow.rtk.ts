import { apiPaths } from '@cf/router/apiRoutes'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import {
  WorkflowChildDataPackage,
  WorkflowParentDataPackage
} from '@XMLHTTP/types'
import { ELibraryObject } from '@XMLHTTP/types/entity'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

/*******************************************************
 * TYPES
 *******************************************************/
export interface GetWorkflowByUuidQueryResp {
  item: {
    uuid: string
    title: string
    owner_id: number
    project_id: number | null
    revision_id: number
    date_created: string
    modified_on: string
  }
}

export type GetWorkflowByUuidQueryTransform = GetWorkflowByUuidQueryResp

type ParentWorkflowResp = any

export type WorkflowParentDataQueryResp = {
  message: string
  dataPackage: WorkflowParentDataPackage
}

export type WorkflowChildDataQueryResp = {
  message: string
  dataPackage: WorkflowChildDataPackage
}

export type CreateWorkflowResp = {
  uuid: string
  title: string
  owner_id: number
  project_id: number | null
  revision_id: number
  date_created: string
  modified_on: string
}

export type GetWorkflowTemplatesQueryResp = {
  message: string
  dataPackage: ELibraryObject[]
}
/*******************************************************
 * MUTATION ARGS
 *******************************************************/
interface BaseUpsertWorkflowArgs {
  title?: string
  description?: string
  courseNumber?: string
  duration?: number
  units?: number
  ponderation?: {
    theory: number
    practice: number
    individual: number
    generalEdu: number
    specificEdu: number
  }
}

export interface UpdateWorkflowArgs extends BaseUpsertWorkflowArgs {
  uuid: string
}

export interface CreateWorkflowArgs extends BaseUpsertWorkflowArgs {
  title: string
  projectId?: number | null
  type: WorkflowType
}

/*******************************************************
 * QUERIES
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getWorkflowByUuid: builder.query<
      GetWorkflowByUuidQueryTransform,
      { uuid: string }
    >({
      query: ({ uuid }) => {
        const base = apiPaths.json_api_v2.workflow.detail
        return {
          method: Verb.GET,
          url: generatePath(base, { uuid })
        }
      }
    }),
    /*******************************************************
     * LIST
     *******************************************************/
    listWorkflowTemplates: builder.query<GetWorkflowTemplatesQueryResp, any>({
      query: (args) => {
        const url = apiPaths.json_api.workflow.list_templates
        return {
          method: Verb.GET,
          url,
          body: args // not implemented, this should probably be another library query
        }
      }
    }),
    listRelatedWorkflowParents: builder.query<
      ParentWorkflowResp,
      { uuid: string }
    >({
      query: (args) => {
        const base = apiPaths.json_api_v2.workflow.related_parents
        return {
          method: Verb.GET,
          url: generatePath(base, { uuid: args.uuid })
        }
      }
    }),
    listRelatedWorkflowChildren: builder.query<
      ParentWorkflowResp,
      { uuid: string }
    >({
      query: (args) => {
        const base = apiPaths.json_api_v2.workflow.related_children
        return {
          method: Verb.GET,
          url: generatePath(base, { uuid: args.uuid })
        }
      }
    }),
    /*******************************************************
     * MUTATIONS
     *******************************************************/
    createWorkflow: builder.mutation<CreateWorkflowResp, CreateWorkflowArgs>({
      query: (args) => {
        const url = apiPaths.json_api_v2.workflow.collection
        const body = {
          project_id: args.projectId ?? null,
          workflow_title: args.title,
          unit_title: args.title,
          unit_type: args.type,
          unit_description: args.description ?? ''
        }
        return {
          method: Verb.POST,
          url,
          body
        }
      }
    }),
    /*******************************************************
     * MUTATIONS: DELETE AND ARCHIVE (restorable 'SOFT' DELETE with flag)
     *******************************************************/
    updateWorkflow: builder.mutation<
      EmptyPostResp,
      {
        uuid: string
        payload: UpdateWorkflowArgs
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api_v2.workflow.detail
        return {
          method: Verb.PATCH,
          url: generatePath(base, { uuid: args.uuid }),
          body: args.payload
        }
      }
    })
  }),
  overrideExisting: false
})

export const {
  useListRelatedWorkflowChildrenQuery,
  useListRelatedWorkflowParentsQuery,
  useGetWorkflowByUuidQuery,
  useUpdateWorkflowMutation,
  useCreateWorkflowMutation,
  useListWorkflowTemplatesQuery
} = extendedApi
