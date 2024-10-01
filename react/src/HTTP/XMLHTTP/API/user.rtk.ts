import { apiPaths } from '@cf/router/apiRoutes'
import { ProfileField } from '@XMLHTTP/types/query'

import { Verb, cfApi } from './api'
/*******************************************************
 * TYPES
 *******************************************************/
export type CurrentUserQueryResp = {
  message: string
  dataPackage: {
    id: number
    firstName: string
    lastName: string
    userName: string
    language: string
  }
}

export type NotificationSettingsQueryResp = {
  message: string
  dataPackage: {
    receiveNotifications: boolean
  }
}

export type NotificationSettingsUpdateQueryResp = {
  message: string
  dataPackage: {
    receiveNotifications: boolean
  }
}

export type ProfileSettingsQueryResp = {
  message: string
  dataPackage: {
    formData: ProfileField[]
  }
}

const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getCurrentUser: builder.query<CurrentUserQueryResp, void>({
      query: () => {
        return {
          method: Verb.GET,
          url: apiPaths.json_api.user.current_user
        }
      }
    }),
    getUserList: builder.query<CurrentUserQueryResp, void>({
      query: () => {
        return {
          method: Verb.POST,
          url: apiPaths.json_api.user.list
        }
      }
    }),
    getNotificationSettings: builder.query<NotificationSettingsQueryResp, void>(
      {
        query: () => {
          return {
            method: Verb.GET,
            url: apiPaths.json_api.user.notification_settings
          }
        }
      }
    ),
    getProfileSettings: builder.query<ProfileSettingsQueryResp, void>({
      query: () => {
        return {
          method: Verb.GET,
          url: apiPaths.json_api.user.profile_settings
        }
      }
    }),
    /*******************************************************
     * MUTATIONS
     *******************************************************/
    updateNotificationSettings: builder.mutation<
      NotificationSettingsUpdateQueryResp,
      {
        notifications: boolean
      }
    >({
      query: (args) => {
        return {
          method: Verb.POST,
          url: apiPaths.json_api.user.notification_settings__update,
          body: args
        }
      }
    })
  }),
  overrideExisting: false
})

export const {
  useGetCurrentUserQuery,
  useGetUserListQuery,
  useGetNotificationSettingsQuery,
  useGetProfileSettingsQuery,
  useLazyGetProfileSettingsQuery,
  useUpdateNotificationSettingsMutation
} = extendedApi
