// @ts-nocheck
import { apiPaths } from '@cf/router/apiRoutes'
import { API_GET } from '@XMLHTTP/CallWrapper'
import { NotificationQueryResp } from '@XMLHTTP/types/query'

export async function getNotifications(): Promise<NotificationQueryResp> {
  const url = apiPaths.json_api.notification.list

  return API_GET<NotificationQueryResp>(url)
}
