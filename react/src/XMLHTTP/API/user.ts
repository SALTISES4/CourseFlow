//Get a list of users, filtered by name
import { UserListResp } from '@XMLHTTP/types/query'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { VERB } from '@cfModule/types/enum'

export function getUserListQuery(
  filter: any,
  callBackFunction = (_data: UserListResp) => console.log('success')
) {
  API_POST(COURSEFLOW_APP.path.json_api.user.list, {
    filter: filter
  }).then((response: UserListResp) => {
    if (response.action == VERB.POSTED) callBackFunction(response)
    else window.fail_function(response.action)
  })
}
