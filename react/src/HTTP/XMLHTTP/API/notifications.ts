import { NotificationQueryResp } from '@XMLHTTP/types/query'
import { API_GET } from '@XMLHTTP/CallWrapper'

export async function fetchNotifications(): Promise<NotificationQueryResp> {
  const url = COURSEFLOW_APP.globalContextData.path.json_api.notification.list
  return API_GET<NotificationQueryResp>(url)
}
