import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType, LibraryObjectType, WorkSpaceType } from '@cf/types/enum'
import { EUser } from '@XMLHTTP/types/entity'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

import { Verb, cfApi } from './api'

/*******************************************************
 * TYPES
 *******************************************************/
export type UsersForObjectQueryResp = {
  message: string
  author: EUser

  viewers: EUser[]
  commentors: EUser[]
  editors: EUser[]
  students: EUser[]

  published: boolean // why here, should move it
  publicView: boolean // why here, should move it
  cannotChange: number[] // what is
  saltiseUser: boolean // what is
  isTemplate: boolean // why here, should move it
}

export type UserListResp = {
  message: string
  dataPackage: {
    userList: EUser[]
  }
}
/*******************************************************
 * QUERIES
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getUsersForObject: builder.query<
      UsersForObjectQueryResp,
      {
        id: number
        payload: {
          objectType: CfObjectType
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspace.user__list
        const url = generatePath(base, { id: args.id })

        return {
          method: Verb.POST,
          url: url,
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
  useGetUsersForObjectQuery,
  useArchiveMutation,
  useUnarchiveMutation,
  useDeleteSelfHardMutation
} = extendedApi
