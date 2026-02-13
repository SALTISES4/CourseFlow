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
    createWeek: builder.mutation<
      EmptyPostResp,
      {
        payload: {
          objectType: CfObjectType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.week.create
        return {
          method: Verb.POST,
          url: base
        }
      }
    }),
    duplicateWeek: builder.mutation<
      EmptyPostResp,
      {
        id: number
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.week.duplicate
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id })
        }
      }
    }),
    updatePositionWeek: builder.mutation<
      EmptyPostResp,
      {
        id: number
        payload: {
          rank: number
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.week.update_position
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    deleteWeek: builder.mutation<
      EmptyPostResp,
      {
        id: number
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.week.delete
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
  useCreateWeekMutation,
  useDuplicateWeekMutation,
  useUpdatePositionWeekMutation,
  useDeleteWeekMutation
} = extendedApi
