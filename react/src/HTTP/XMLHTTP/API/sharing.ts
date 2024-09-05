import { VERB } from '@cf/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { EmptyPostResp, UsersForObjectQueryResp } from '@XMLHTTP/types/query'

export function setUserPermission(
  user_id,
  objectId,
  objectType,
  permission_type,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.set_permission, {
    objectId: objectId,
    objectType: objectType,
    permission_user: user_id,
    permission_type: permission_type
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

export function getUsersForObjectQuery(
  objectId: number,
  objectType: string
): Promise<UsersForObjectQueryResp> {
  //@todo fix this
  if (['program', 'course', 'activity'].indexOf(objectType) >= 0) {
    objectType = 'workflow'
  }
  return API_POST<UsersForObjectQueryResp>(
    COURSEFLOW_APP.globalContextData.path.post_paths.get_users_for_object,
    {
      objectId: objectId,
      objectType: objectType
    }
  )
}

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
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.get_users_for_object,
    {
      objectId: objectId,
      objectType: objectType
    }
  ).then((response: UsersForObjectQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
