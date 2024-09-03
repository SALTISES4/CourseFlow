import * as Constants from '@cf/constants'
import { GetProjectByIdQueryResp } from '@XMLHTTP/types/query'

export const calcIsProjectReadOnly = (
  data: GetProjectByIdQueryResp
): boolean => {
  return (
    data.data_package.project_data.object_permission.permission_type ===
    Constants.permission_keys['edit']
  )
}
