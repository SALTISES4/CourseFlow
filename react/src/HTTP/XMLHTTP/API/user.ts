import { ToDefine } from '@cf/types/common'
import { LibraryObjectType, VERB } from '@cf/types/enum'
import { API_GET, API_POST } from '@XMLHTTP/CallWrapper'
import { ToggleFavouriteQueryArgs } from '@XMLHTTP/types/args'
import {
  EmptyPostResp,
  NotificationSettingsQueryResp,
  ProfileSettingsQueryResp,
  UserListResp
} from '@XMLHTTP/types/query'

/*******************************************************
 * USERS MODEL QUERY
 *******************************************************/
/**
 *
 * @param filter
 * @param callBackFunction
 */
export function getUserListQuery(
  filter: any,
  callBackFunction = (_data: UserListResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.json_api.user.list, {
    filter: filter
  }).then((response: UserListResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

/*******************************************************
 * NOTIFICATIONS SETTINGS
 *******************************************************/
export async function getNotificationSettings(): Promise<NotificationSettingsQueryResp> {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.user.notification_settings
  return API_GET<NotificationSettingsQueryResp>(url)
}

export async function updateNotificationSettings(data: any) {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.user
      .notification_settings__update
  return API_POST(url, data)
}

/*******************************************************
 * PROFILE SETTINGS
 *******************************************************/
export async function getProfileSettings(): Promise<ProfileSettingsQueryResp> {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.user.profile_settings
  return API_GET<ProfileSettingsQueryResp>(url)
}
