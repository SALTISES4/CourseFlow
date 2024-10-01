import { apiPaths } from '@cf/router/apiRoutes'
import { LibraryObjectType, WorkSpaceType } from '@cf/types/enum'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import { TWorkflow } from '@cfRedux/types/type'
import {
  WorkflowChildDataPackage,
  WorkflowDataPackage,
  WorkflowParentDataPackage
} from '@XMLHTTP/types'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

import { Verb, cfApi } from './api'

/*******************************************************iew/componentViews/WorkflowView/components/Term.tsx
 * TYPES
 *******************************************************/
export interface WorkflowDataQueryResp {
  message: string
  dataPackage: WorkflowDataPackage
}

export interface WorkflowDataQueryTransform {
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

export type UpdateWorkflowArgs = {
  description: string
  duration: string
  title: string
  units: number
}

/*******************************************************
 * QUERIES
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getWorkflowById: builder.query<WorkflowDataQueryTransform, { id: number }>({
      query: (id) => {
        const base = apiPaths.json_api.workflow.detail
        return {
          method: Verb.GET,
          url: generatePath(base, { id })
        }
      },
      transformResponse: (
        response: WorkflowDataQueryResp
      ): WorkflowDataQueryTransform => {
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
     * MUTATIONS
     *******************************************************/
    /*******************************************************
     * MUTATIONS: DELETE AND ARCHIVE (restorable 'SOFT' DELETE with flag)
     *******************************************************/
    update: builder.mutation<
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
    }),
    archive: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          objectType: WorkSpaceType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspace.delete_soft
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    unarchive: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          objectType: WorkSpaceType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspace.restore
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    deleteSelfHard: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          objectType: LibraryObjectType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspace.delete
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
  useArchiveMutation,
  useUnarchiveMutation,
  useDeleteSelfHardMutation,
  useUpdateMutation
} = extendedApi
