import { apiPaths } from '@cf/router/apiRoutes'
import { UsersForObjectQueryResp } from '@XMLHTTP/API/workspaceUser.rtk'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { generatePath } from 'react-router-dom'

export function setUserPermission(
  userId,
  objectId,
  objectType,
  permissionType,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  const base = apiPaths.json_api.workspaceUser.update
  const url = generatePath(base, { id: objectId })

  API_POST(url, {
    objectType: objectType,
    permission_user: userId,
    permissionType: permissionType
  }).then((response: EmptyPostResp) => {
    callBackFunction(response)
  })
}

// export function getUsersForObjectQuery(
//   objectId: number,
//   objectType: string
// ): Promise<UsersForObjectQueryResp> {
//   //@todo fix this
//   if (['program', 'course', 'activity'].indexOf(objectType) >= 0) {
//     objectType = 'workflow'
//   }
//
//   return API_POST<UsersForObjectQueryResp>(
//     COURSEFLOW_APP.globalContextData.path.post_paths.get_users_for_object,
//     {
//       objectId: objectId,
//       objectType: objectType
//     }
//   )
// }

// to remove
/**
 *  @getUsersForObjectQuery
 *
 *  endpoint project/get-users-for-object/
 *
 *  Get the list of users for a project
 * @param objectId
 * @param objectType
 * @param callBackFunction
 */
export function getUsersForObjectQueryLegacy(
  objectId: number,
  objectType: string,
  callBackFunction = (_data: UsersForObjectQueryResp) => console.log('success')
) {
  if (['program', 'course', 'activity'].indexOf(objectType) >= 0)
    objectType = 'workflow'
  const base = apiPaths.json_api.workspaceUser.list
  const url = generatePath(base, { id: objectId })
  API_POST(url, {
    objectType: objectType
  }).then((response: UsersForObjectQueryResp) => {
    callBackFunction(response)
  })
}
