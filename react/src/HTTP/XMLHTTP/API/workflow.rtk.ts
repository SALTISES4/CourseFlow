import { apiPaths } from '@cf/router/apiRoutes'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { TWorkflow } from '@cfRedux/types/type'
import {
  WorkflowChildDataPackage,
  WorkflowDataPackage,
  WorkflowParentDataPackage
} from '@XMLHTTP/types'
import { ELibraryObject } from '@XMLHTTP/types/entity'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

import { Verb, cfApi } from './api'

/*******************************************************
 * TYPES
 *******************************************************/
export interface GetWorkflowByIdQueryResp {
  message: string
  dataPackage: WorkflowDataPackage
}

export interface GetWorkflowByIdQueryTransform {
  message: string
  dataPackage: Omit<WorkflowDataPackage, 'workflow'> & {
    workflow: TWorkflow
  }
}

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
  message: string
  dataPackage: {
    id: number
  }
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
  duration?: string
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
  id: number
}

export interface CreateWorkflowArgs extends BaseUpsertWorkflowArgs {
  title: string
  projectId: number
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
    getWorkflowById: builder.query<
      GetWorkflowByIdQueryTransform,
      { id: number }
    >({
      query: ({ id }) => {
        const base = apiPaths.json_api.workflow.detail
        return {
          method: Verb.GET,
          url: generatePath(base, { id })
        }
      },
      transformResponse: (
        response: GetWorkflowByIdQueryResp
      ): GetWorkflowByIdQueryTransform => {
        return {
          ...response,
          dataPackage: {
            ...response.dataPackage,
            workflow: {
              ...response.dataPackage.workflow,
              workflowPermissions: calcWorkflowPermissions(
                response.dataPackage.workflow.userPermissions
              )
            }
          }
        }
      }
    }),
    getParentWorkflowInfo: builder.query<ParentWorkflowResp, { id: number }>({
      query: (args) => {
        const base = apiPaths.json_api.workflow.parent__detail__full
        return {
          method: Verb.GET,
          url: generatePath(base, { id: args.id })
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
    /*******************************************************
     * MUTATIONS
     *******************************************************/
    createWorkflow: builder.mutation<CreateWorkflowResp, CreateWorkflowArgs>({
      query: (args) => {
        const url = apiPaths.json_api.workflow.create
        return {
          method: Verb.POST,
          url,
          body: args
        }
      }
    }),
    /*******************************************************
     * MUTATIONS: DELETE AND ARCHIVE (restorable 'SOFT' DELETE with flag)
     *******************************************************/
    updateWorkflow: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: UpdateWorkflowArgs
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workflow.update
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    })
  }),
  overrideExisting: false
})

export const {
  useGetParentWorkflowInfoQuery,
  useGetWorkflowByIdQuery,
  useUpdateWorkflowMutation,
  useCreateWorkflowMutation,
  useListWorkflowTemplatesQuery
} = extendedApi
