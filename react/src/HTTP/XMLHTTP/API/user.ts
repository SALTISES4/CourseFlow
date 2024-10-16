import { apiPaths } from '@cf/router/apiRoutes'
import {UserListResp} from "@XMLHTTP/API/workspaceUser.rtk";
import { API_POST } from '@XMLHTTP/CallWrapper'

/**
 *
 * @param filter
 * @param callBackFunction
 */
// export async function getCurrentUserQuery(): Promise<CurrentUserQueryResp> {
//   const url = apiPaths.json_api.user.current_user
//   return API_GET<CurrentUserQueryResp>(url)
// }

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
  const url = apiPaths.json_api.user.list
  API_POST(url, {
    filter: filter
  }).then((response: UserListResp) => {
    callBackFunction(response)
  })
}

/*******************************************************
 * NOTIFICATIONS SETTINGS
 *******************************************************/
// export async function getNotificationSettings(): Promise<NotificationSettingsQueryResp> {
//   const url = apiPaths.json_api.user.notification_settings
//   return API_GET<NotificationSettingsQueryResp>(url)
// }

// export async function updateNotificationSettings(data: any) {
//   const url = apiPaths.json_api.user.notification_settings__update
//   return API_POST(url, data)
// }

/*******************************************************
 * PROFILE SETTINGS
 *******************************************************/
// export async function getProfileSettings(): Promise<ProfileSettingsQueryResp> {
//   const url = apiPaths.json_api.user.profile_settings
//   return API_GET<ProfileSettingsQueryResp>(url)
// }
