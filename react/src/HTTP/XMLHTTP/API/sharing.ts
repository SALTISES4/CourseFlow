import { EmptyPostResp, UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'
import { API_POST } from '@XMLHTTP/CallWrapper'

export function setUserPermission(
  user_id,
  objectID,
  objectType,
  permission_type,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.globalContextData.path.post_paths.set_permission, {
    objectID: objectID,
    objectType: objectType,
    permission_user: user_id,
    permission_type: permission_type
  }).then((response: EmptyPostResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}

/**
 *  @getUsersForObjectQuery
 *
 *  endpoint project/get-users-for-object/
 *
 *  Get the list of users for a project
 * @param objectID
 * @param objectType
 * @param callBackFunction
 */
export function getUsersForObjectQuery(
  objectID: number,
  objectType: string,
  callBackFunction = (_data: UsersForObjectQueryResp) => console.log('success')
) {
  if (['program', 'course', 'activity'].indexOf(objectType) >= 0)
    objectType = 'workflow'
  API_POST(
    COURSEFLOW_APP.globalContextData.path.post_paths.get_users_for_object,
    {
      objectID: objectID,
      objectType: objectType
    }
  ).then((response: UsersForObjectQueryResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
