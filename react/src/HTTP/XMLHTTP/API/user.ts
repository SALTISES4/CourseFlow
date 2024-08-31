import {
  EmptyPostResp,
  NotificationSettingsQueryResp,
  ProfileSettingsQueryResp,
  UserListResp
} from '@XMLHTTP/types/query'
import { API_GET, API_POST } from '@XMLHTTP/CallWrapper'
import { LibraryObjectType, VERB } from '@cfModule/types/enum'
import { ToDefine } from '@cfModule/types/common'
import { ToggleFavouriteQueryArgs } from '@XMLHTTP/types/args'

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
export async function fetchNotificationSettings(): Promise<NotificationSettingsQueryResp> {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.user.notification_settings
  return API_GET<NotificationSettingsQueryResp>(url)
}

export async function updateNotificationSettings(data: any) {
  return API_POST(
    COURSEFLOW_APP.globalContextData.path.json_api.user
      .notification_settings__update,
    data
  )
}

/*******************************************************
 * PROFILE SETTINGS
 *******************************************************/
export async function fetchProfileSettings(): Promise<ProfileSettingsQueryResp> {
  const url =
    COURSEFLOW_APP.globalContextData.path.json_api.user.profile_settings
  return API_GET<ProfileSettingsQueryResp>(url)
}

