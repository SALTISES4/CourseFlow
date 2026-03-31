import { apiPaths } from '@cf/router/apiRoutes'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { generatePath } from 'react-router-dom'

/*******************************************************
 *  Notification
 *******************************************************/
export interface NotificationItem {
  uuid: string
  message: string
  is_read: boolean
  date_created: string
}

export interface NotificationQueryResp {
  message?: string
  items: NotificationItem[]
  meta: {
    total: number
    unread_count: number
  }
}

export interface NotificationMarkAllAsReadResp {
  message?: string
  meta: {
    updated_count: number
    unread_count: number
  }
}

export interface NotificationItemResp {
  message?: string
  item: NotificationItem
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
          url: apiPaths.json_api_v2.user.me_notifications
        }
      }
    }),
    markNotificationAsRead: builder.mutation<NotificationItemResp, { uuid: string }>({
      query: ({ uuid }) => {
        return {
          method: Verb.POST,
          url: generatePath(
            apiPaths.json_api_v2.user.me_notification_mark_as_read,
            { uuid }
          )
        }
      }
    }),
    markAllNotificationsAsRead: builder.mutation<NotificationMarkAllAsReadResp, void>({
      query: () => {
        return {
          method: Verb.POST,
          url: apiPaths.json_api_v2.user.me_notifications_mark_all_as_read
        }
      }
    }),
    deleteNotification: builder.mutation<void, { uuid: string }>({
      query: ({ uuid }) => {
        return {
          method: Verb.DELETE,
          url: generatePath(apiPaths.json_api_v2.user.me_notification_detail, {
            uuid
          })
        }
      }
    })
  }),
  overrideExisting: false
})

export const {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation
} = extendedApi
