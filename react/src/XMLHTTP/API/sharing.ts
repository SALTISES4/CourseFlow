import {
  EmptyPostResp,
  UsersForObjectQueryResp,
  UserListResp
} from '@XMLHTTP/types/query'
import { VERB } from '@cfModule/types/enum'

export function setUserPermission(
  user_id,
  objectID,
  objectType,
  permission_type,
  callBackFunction = (_data: EmptyPostResp) => console.log('success')
) {
  $.post(COURSEFLOW_APP.config.post_paths.set_permission, {
    objectID: JSON.stringify(objectID),
    objectType: JSON.stringify(objectType),
    permission_user: JSON.stringify(user_id),
    permission_type: JSON.stringify(permission_type)
  })
    .done(function (data: EmptyPostResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.error)
    })
    .fail(function (error) {
      // Handle error specific to the AJAX request
      window.fail_function()
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
  $.post(COURSEFLOW_APP.config.post_paths.get_users_for_object, {
    objectID: JSON.stringify(objectID),
    objectType: JSON.stringify(objectType)
  })
    .done(function (data: UsersForObjectQueryResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
    .fail(function (error) {
      // Handle error specific to the AJAX request
      window.fail_function()
    })
}

//Get a list of users, filtered by name
export function getUserListQuery(
  filter: any,
  callBackFunction = (_data: UserListResp) => console.log('success')
) {
  $.post(COURSEFLOW_APP.config.post_paths.get_user_list, {
    filter: JSON.stringify(filter)
  })
    .done(function (data: UserListResp) {
      if (data.action === VERB.POSTED) callBackFunction(data)
      else window.fail_function(data.action)
    })
    .fail(function (error) {
      // Handle error specific to the AJAX request
      window.fail_function()
    })
}
