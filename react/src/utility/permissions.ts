import { PermissionKeys } from '@cf/constants'

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
    case PermissionKeys.VIEW:
      return {
        ...defaultWorkflowPermissions,
        read: true
      }
    case PermissionKeys.COMMENT:
      return {
        ...defaultWorkflowPermissions,
        viewComments: true,
        addComments: true,
        read: true
      }

    case PermissionKeys.EDIT:
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
): WorkflowPermission => {
  switch (permission) {
    case PermissionKeys.VIEW:
      return {
        ...defaultBasePermissions,
        read: true,
        viewComments: true,
        addComments: false
      }
    case PermissionKeys.EDIT:
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
