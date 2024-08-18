import { NotificationQueryResp } from '@XMLHTTP/types/query'
import { API_GET } from '@XMLHTTP/CallWrapper'

export async function fetchNotifications(): Promise<NotificationQueryResp> {
  const url = COURSEFLOW_APP.path.json_api.user.notification
  return API_GET<NotificationQueryResp>(url)
}
