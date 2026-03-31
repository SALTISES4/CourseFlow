import { apiPaths } from '@cf/router/apiRoutes'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { EUser } from '@XMLHTTP/types/entity'

/*******************************************************
 * TYPES
 *******************************************************/
export enum LanguageOptions {
  EN = 'en',
  FR = 'fr'
}

/*******************************************************
 * RESP
 *******************************************************/
export type CurrentUserQueryResp = {
  message?: string
  item: EUser
}

export type NotificationSettingsQueryResp = {
  message?: string
  item: {
    notifications_active: boolean
  }
}

export type ProfileSettingsQueryResp = {
  message?: string
  item: {
    uuid: string
    email: string
    first_name: string
    last_name: string
    language_preference: LanguageOptions
  }
}

export type UserListItem = {
  uuid: string
  email: string
  first_name: string
  last_name: string
}

export type UserListQueryResp = {
  message?: string
  items: UserListItem[]
  meta: {
    total: number
  }
}
/*******************************************************
 * ARGS
 *******************************************************/

export type ProfileSettingsArgs = {
  firstName: string
  lastName: string
  languagePreference: LanguageOptions
}

/*******************************************************
 *
 *******************************************************/
const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getCurrentUser: builder.query<CurrentUserQueryResp, void>({
      query: () => {
        return {
          method: Verb.GET,
          url: apiPaths.json_api_v2.auth.me
        }
      }
    }),
    getNotificationSettings: builder.query<NotificationSettingsQueryResp, void>(
      {
        query: () => {
          return {
            method: Verb.GET,
            url: apiPaths.json_api_v2.user.me_notification_settings
          }
        }
      }
    ),
    getProfileSettings: builder.query<ProfileSettingsQueryResp, void>({
      query: () => {
        return {
          method: Verb.GET,
          url: apiPaths.json_api_v2.user.me_profile_settings
        }
      }
    }),
    listUsers: builder.query<UserListQueryResp, void>({
      query: () => {
        return {
          method: Verb.GET,
          url: apiPaths.json_api_v2.user.collection
        }
      }
    }),
    /*******************************************************
     * MUTATIONS
     *******************************************************/
    updateNotificationSettings: builder.mutation<
      NotificationSettingsQueryResp,
      {
        notifications: boolean
      }
    >({
      query: (args) => {
        return {
          method: Verb.PATCH,
          url: apiPaths.json_api_v2.user.me_notification_settings,
          body: {
            notifications_active: args.notifications
          }
        }
      }
    }),
    updateProfileSettings: builder.mutation<
      ProfileSettingsQueryResp,
      ProfileSettingsArgs
    >(
      {
        query: (args) => {
          return {
            method: Verb.PATCH,
            url: apiPaths.json_api_v2.user.me_profile_settings,
            body: {
              first_name: args.firstName,
              last_name: args.lastName,
              language_preference: args.languagePreference
            }
          }
        }
      }
    )
  }),
  overrideExisting: false
})

export const {
  useGetCurrentUserQuery,
  useGetNotificationSettingsQuery,
  useGetProfileSettingsQuery,
  useListUsersQuery,
  useUpdateNotificationSettingsMutation,
  useUpdateProfileSettingsMutation
} = extendedApi
