import { apiPaths } from '@cf/router/apiRoutes'
import Utility from '@cf/utility/Utility.class'
import { TNotification } from '@cfRedux/types/type'
import { Verb, cfApi } from '@XMLHTTP/API/api'
import { ENotification } from '@XMLHTTP/types/entity'


/*******************************************************
 *  Notification
 *******************************************************/
export interface NotificationQueryResp {
  message: string
  dataPackage: {
    items: ENotification[]
    meta: {
      unreadCount: number
    }
  }
}

export interface NotificationQueryRespTransform extends NotificationQueryResp {
  dataPackage: {
    items: TNotification[]
    meta: {
      unreadCount: number
    }
  }
}

const extendedApi = cfApi.injectEndpoints({
  endpoints: (builder) => ({
    /*******************************************************
     * QUERIES
     *******************************************************/
    getNotifications: builder.query<NotificationQueryRespTransform, void>({
      query: () => {
        return {
          method: Verb.GET,
          url: apiPaths.json_api.notification.list
        }
      },
      transformResponse: (
        response: NotificationQueryResp
      ): NotificationQueryRespTransform => {
        return {
          ...response,
          dataPackage: {
            ...response.dataPackage,
            items: response.dataPackage.items.map((item) => {
              return {
                ...item,
                url: Utility.getPathByObject(item.id, item.type)
              }
            })
          }
        }
      }
    })
  }),
  overrideExisting: false
})

export const { useGetNotificationsQuery } = extendedApi
