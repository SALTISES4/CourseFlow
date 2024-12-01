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
    create: builder.mutation<
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
    updatePosition: builder.mutation<
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
    delete: builder.mutation<
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
  useCreateMutation: useCreateColumnMutation,
  useUpdatePositionMutation: useUpdatePositionColumnMutation,
  useDeleteMutation: useDeleteColumnMutation
} = extendedApi
