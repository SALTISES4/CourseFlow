import { API_GET } from '@XMLHTTP/CallWrapper'
import { NotificationQueryResp } from '@XMLHTTP/types/query'

export async function getNotifications(): Promise<NotificationQueryResp> {
  const url = COURSEFLOW_APP.globalContextData.path.json_api.notification.list
  return API_GET<NotificationQueryResp>(url)
}
