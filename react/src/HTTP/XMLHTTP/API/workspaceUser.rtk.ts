import { apiPaths } from '@cf/router/apiRoutes'
import { PermissionGroup } from '@cf/types/common'
import { WorkspaceType } from '@cfPages/Workspace/Workflow/types'
import { EUser, EWorkspaceUser } from '@XMLHTTP/types/entity'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

import { Verb, cfApi } from './api'

/*******************************************************
 * TYPES
 *******************************************************/
export type WorkspaceUser = {
  userId: number
  type: WorkspaceType
  group: PermissionGroup
}
export type WorkspaceSimpleUser = Omit<WorkspaceUser, 'group'>

/*******************************************************
 * RESPONSE
 *******************************************************/
export type UsersForObjectQueryResp = {
  message: string
  dataPackage: EWorkspaceUser[]
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
    getUserList: builder.query<UserListResp, UserListQueryArgs>({
      query: (args) => {
        return {
          method: Verb.POST,
          url: apiPaths.json_api.user.list,
          body: args
        }
      }
    }),
    getUsersForObject: builder.query<
      UsersForObjectQueryResp,
      {
        id: number
        payload: {
          objectType: WorkspaceType
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
    getUsersForObjectAvailable: builder.query<
      UsersForObjectQueryResp,
      {
        id: number
        payload: {
          objectType: WorkspaceType
          filter: string
        }
      }
    >({
      query: (args) => {
        const base = apiPaths.json_api.workspaceUser.list_available
        const url = generatePath(base, { id: args.id })

        return {
          method: Verb.POST,
          url: url,
          body: args.payload
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
  useGetUserListQuery,
  useGetUsersForObjectQuery,
  useGetUsersForObjectAvailableQuery,
  useWorkspaceUserCreateMutation,
  useWorkspaceUserDeleteMutation,
  useWorkspaceUserUpdateMutation
} = extendedApi
