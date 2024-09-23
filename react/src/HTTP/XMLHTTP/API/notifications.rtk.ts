import { apiPaths } from '@cf/router/apiRoutes'

import { Verb, cfApi } from './api'

/*******************************************************
 *  Notification
 *******************************************************/
export type NotificationQueryResp = {
  message: string
  dataPackage: {
    notifications: any
    unreadCount: number
  }
}

const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getNotifications: builder.query<NotificationQueryResp, void>({
      query: () => {
        return {
          method: Verb.GET,
          url: apiPaths.json_api.notification.list
        }
      }
    })
  }),
  overrideExisting: false
})

export const { useGetNotificationsQuery } = extendedApi
