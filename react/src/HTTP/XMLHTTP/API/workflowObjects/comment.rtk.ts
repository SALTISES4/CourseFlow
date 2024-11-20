import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { LibraryObjectsSearchQueryResp } from '@XMLHTTP/API/library.rtk'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import {
  CommentsForObjectQueryArgs,
  CommentsForObjectQueryResp,
  EmptyPostResp
} from '@XMLHTTP/types/query'


/*******************************************************
 *  Notification
 *******************************************************/

const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    fetchByObject: builder.query<
      CommentsForObjectQueryResp,
      CommentsForObjectQueryArgs
    >({
      query: (args) => {
        return {
          method: Verb.POST,
          url: apiPaths.json_api.comment.list_by_object,
          body: args
        }
      }
    }),
    createComment: builder.mutation<
      EmptyPostResp,
      {
        payload: {
          objectId: number
          objectType: CfObjectType
          text: string
        }
      }
    >({
      query: (args) => {
        const url = apiPaths.json_api.workflow.object__insert_child
        return {
          method: Verb.POST,
          url,
          body: args.payload
        }
      }
    }),
    deleteComment: builder.mutation<
      EmptyPostResp,
      {
        payload: {
          objectId: number
          commentId: number // why do we need anything but this?
          objectType: CfObjectType
        }
      }
    >({
      query: (args) => {
        const url = apiPaths.json_api.comment.delete
        return {
          method: Verb.POST,
          url,
          body: args.payload
        }
      }
    }),
    deleteAllByObject: builder.mutation<
      EmptyPostResp,
      {
        payload: {
          objectId: number
          objectType: CfObjectType
        }
      }
    >({
      query: (args) => {
        const url = apiPaths.json_api.comment.delete_all
        return {
          method: Verb.POST,
          url,
          body: args.payload
        }
      }
    })
  }),
  overrideExisting: false
})

export const {
  useCreateCommentMutation,
  useDeleteAllByObjectMutation,
  useDeleteCommentMutation,
  useFetchByObjectQuery
} = extendedApi
