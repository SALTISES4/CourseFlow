import * as Constants from '@cf/constants'
import { PERMISSION_KEYS } from '@cf/constants'
import { WorkflowPermission } from '@cfPages/Workspace/Workflow/types'
import { GetProjectByIdQueryResp } from '@XMLHTTP/types/query'

export const calcIsProjectReadOnly = (
  data: GetProjectByIdQueryResp
): boolean => {
  return (
    data.data_package.project_data.object_permission.permission_type ===
    Constants.permission_keys['edit']
  )
}
const defaultWorkflowPermissions: WorkflowPermission = {
  readOnly: false,
  viewComments: false,
  addComments: false,
  canView: false
}

export const calcWorkflowPermissions = (
  userPermission: number
): WorkflowPermission => {
  switch (userPermission) {
    case PERMISSION_KEYS.VIEW:
      return {
        ...defaultWorkflowPermissions,
        canView: true
      }
    case PERMISSION_KEYS.COMMENT:
      return {
        ...defaultWorkflowPermissions,
        viewComments: true,
        addComments: true,
        canView: true
      }

    case PERMISSION_KEYS.EDIT:
      return {
        ...defaultWorkflowPermissions,
        viewComments: true,
        addComments: true,
        canView: true
      }
  }
  return defaultWorkflowPermissions
}
