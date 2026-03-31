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
        id: string
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
    duplicateNode: builder.mutation<
      EmptyPostResp,
      {
        id: string
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
        id: string
        payload: {
          weekid: string
          columnid: string
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
    // TODO: review where this is used / if at all
    // toggleObjectSetNode: builder.mutation<
    //   EmptyPostResp,
    //   {
    //     id: string
    //     payload: {
    //       objectSetid: string
    //     }
    //   }
    // >({
    //   query: (args) => {
    //     const base = apiPaths.json_api.node.toggle_object_set
    //     return {
    //       method: Verb.POST,
    //       url: generatePath(base, { id: args.id }),
    //       body: args.payload
    //     }
    //   }
    // }),
    linkToWorkflow: builder.mutation<
      EmptyPostResp,
      {
        id: string
        payload: {
          workflowid: string
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
    })
    // TODO: review where this is used / if at all
    // nodelinkCreate: builder.mutation<
    //   EmptyPostResp,
    //   {
    //     id: string
    //     payload: {
    //       targetNodeid: string
    //     }
    //   }
    // >({
    //   query: (args) => {
    //     const base = apiPaths.json_api.node.link_create
    //     return {
    //       method: Verb.POST,
    //       url: generatePath(base, { id: args.id }),
    //       body: args.payload
    //     }
    //   }
    // })
  }),

  overrideExisting: false
})

export const {
  useCreateNodeMutation,
  useDeleteNodeMutation,
  useDuplicateNodeMutation,
  useUpdatePositionNodeMutation,
  useLinkToWorkflowMutation
  // useNodelinkCreateMutation
  // useToggleObjectSetNodeMutation
} = extendedApi
