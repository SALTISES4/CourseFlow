import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

/*******************************************************
 * TYPES
 *******************************************************/

/*******************************************************
 * QUERIES
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * MUTATION
     *******************************************************/
    createNode: builder.mutation<
      EmptyPostResp,
      {
        payload: {
          objectType: CfObjectType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.node.create
        return {
          method: Verb.POST,
          url: base,
          body: args.payload
        }
      }
    }),
    deleteNode: builder.mutation<
      EmptyPostResp,
      {
        id: number
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.node.delete
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id })
        }
      }
    }),
    deleteSoftNode: builder.mutation<
      EmptyPostResp,
      {
        id: number
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.node.delete_soft
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id })
        }
      }
    }),
    restoreNode: builder.mutation<
      EmptyPostResp,
      {
        id: number
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.node.restore
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id })
        }
      }
    }),
    duplicateNode: builder.mutation<
      EmptyPostResp,
      {
        id: number
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.node.duplicate
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id })
        }
      }
    }),
    updatePositionNode: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          weekId: number
          columnId: number
          rank: number
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.node.update_position
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    linkToWorkflow: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          workflowId: number
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.node.link_to_workflow
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    nodelinkCreate: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          targetNodeId: number
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.node.link__create
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
  useCreateNodeMutation,
  useDeleteNodeMutation,
  useDeleteSoftNodeMutation,
  useRestoreNodeMutation,
  useDuplicateNodeMutation,
  useUpdatePositionMutation: useUpdatePositionNodeMutation,
  useLinkToWorkflowMutation,
  useNodelinkCreateMutation
} = extendedApi
