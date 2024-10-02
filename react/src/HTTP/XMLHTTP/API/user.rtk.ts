import { apiPaths } from '@cf/router/apiRoutes'
import { EmptyPostResp } from '@XMLHTTP/types/query'

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

export enum LanguageOptions {
  EN = 'en',
  FR = 'fr'
}

export type NotificationSettingsQueryResp = {
  message: string
  dataPackage: {
    receiveNotifications: boolean
  }
}

export type ProfileSettingsQueryResp = {
  message: string
  dataPackage: {
    firstName: string
    lastName: string
    language: LanguageOptions
  }
}

export type ProfileSettingsArgs = {
  firstName: string
  lastName: string
  language: LanguageOptions
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
      EmptyPostResp,
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
    }),
    updateProfileSettings: builder.mutation<EmptyPostResp, ProfileSettingsArgs>(
      {
        query: (args) => {
          return {
            method: Verb.POST,
            url: apiPaths.json_api.user.profile_settings__update,
            body: args
          }
        }
      }
    )
  }),
  overrideExisting: false
})

export const {
  useGetCurrentUserQuery,
  useGetUserListQuery,
  useGetNotificationSettingsQuery,
  useGetProfileSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useUpdateProfileSettingsMutation
} = extendedApi
