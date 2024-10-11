import { apiPaths } from '@cf/router/apiRoutes'
import { LibraryObjectType, WorkSpaceType } from '@cf/types/enum'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

import { Verb, cfApi } from './api'

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
  useArchiveMutation,
  useUnarchiveMutation,
  useDeleteSelfHardMutation
} = extendedApi
