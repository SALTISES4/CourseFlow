import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType, LibraryObjectType, WorkspaceType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { API_POST } from '@XMLHTTP/CallWrapper'
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
    createColumn: builder.mutation<
      EmptyPostResp,
      {
        payload: {
          objectType: CfObjectType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.column.create
        return {
          method: Verb.POST,
          url: base,
          body: args.payload
        }
      }
    }),
    updatePositionColumn: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          rank: number
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.column.update_position
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    deleteColumn: builder.mutation<
      EmptyPostResp,
      {
        id: number
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.column.delete
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id })
        }
      }
    })
  }),

  overrideExisting: false
})

export const {
  useCreateColumnMutation,
  useUpdatePositionColumnMutation,
  useDeleteColumnMutation
} = extendedApi
