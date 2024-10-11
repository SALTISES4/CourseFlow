import { apiPaths } from '@cf/router/apiRoutes'
import { PermissionGroup } from '@cf/types/common'
import { CfObjectType, WorkSpaceType } from '@cf/types/enum'
import { EUser } from '@XMLHTTP/types/entity'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

import { Verb, cfApi } from './api'

/*******************************************************
 * TYPES
 *******************************************************/
export type WorkspaceUser = {
  userId: number
  type: WorkSpaceType
  group: PermissionGroup
}
export type WorkspaceSimpleUser = Omit<WorkspaceUser, 'group'>

/*******************************************************
 * RESPONSE
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
 * ARGS
 *******************************************************/
export type UserListQueryArgs = {
  filter: string
}

export type WorkspaceUserArgs = {
  id: number // workspace id
  payload: WorkspaceUser
}

export type WorkspaceDeleteUserArgs = {
  id: number // workspace id
  payload: WorkspaceSimpleUser
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
        const base = apiPaths.json_api.workspaceUser.list
        const url = generatePath(base, { id: args.id })

        return {
          method: Verb.POST,
          url: url,
          body: args.payload
        }
      }
    }),
    getUserList: builder.query<UserListResp, UserListQueryArgs>({
      query: (args) => {
        return {
          method: Verb.POST,
          url: apiPaths.json_api.user.list,
          body: args
        }
      }
    }),
    /*******************************************************
     * MUTATION
     *******************************************************/
    workspaceUserCreate: builder.mutation<EmptyPostResp, WorkspaceUserArgs>({
      query: (args) => {
        const base = apiPaths.json_api.workspaceUser.create
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    workspaceUserDelete: builder.mutation<
      EmptyPostResp,
      WorkspaceDeleteUserArgs
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspaceUser.delete
        return {
          method: Verb.POST,
          url: generatePath(base, { id: args.id }),
          body: args.payload
        }
      }
    }),
    workspaceUserUpdate: builder.mutation<EmptyPostResp, WorkspaceUserArgs>({
      query: (args) => {
        const base = apiPaths.json_api.workspaceUser.update
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
  useGetUserListQuery,
  useWorkspaceUserCreateMutation,
  useWorkspaceUserDeleteMutation,
  useWorkspaceUserUpdateMutation
} = extendedApi
