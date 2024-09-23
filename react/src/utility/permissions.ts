import { PERMISSION_KEYS } from '@cf/constants'

export interface BasePermissions {
  read: boolean
  write: boolean
  manage: boolean
}

export interface WorkflowPermission extends BasePermissions {
  viewComments: boolean // change to read comments
  addComments: boolean // change to create comments
}
const defaultBasePermissions: BasePermissions = {
  read: false,
  write: false,
  manage: false
}
const defaultWorkflowPermissions: WorkflowPermission = {
  read: false,
  write: false,
  manage: false,
  viewComments: false,
  addComments: false
}

export const calcProjectPermissions = (
  permission: number
): WorkflowPermission => {
  switch (permission) {
    case PERMISSION_KEYS.VIEW:
      return {
        ...defaultWorkflowPermissions,
        read: true
      }
    case PERMISSION_KEYS.COMMENT:
      return {
        ...defaultWorkflowPermissions,
        viewComments: true,
        addComments: true,
        read: true
      }

    case PERMISSION_KEYS.EDIT:
      return {
        read: true,
        write: true,
        manage: true,
        viewComments: true,
        addComments: true
      }
  }
  return defaultWorkflowPermissions
}

export const calcWorkflowPermissions = (
  permission: number
): BasePermissions => {
  switch (permission) {
    case PERMISSION_KEYS.VIEW:
      return {
        ...defaultBasePermissions,
        read: true
      }
    case PERMISSION_KEYS.EDIT:
      return {
        read: true,
        write: true,
        manage: true
      }
  }
  return defaultWorkflowPermissions
}
