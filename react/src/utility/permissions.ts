import {PermissionGroup} from "@cf/types/common";
import { _t } from '@cf/utility/utilityFunctions'

export type Role = {
  value: PermissionGroup
  label: string
}
type SelectOption = {
  value: string | number
  label: string
}
export const permissionGroupMenuOptions: SelectOption[] = [
  {
    value: PermissionGroup.EDIT,
    label: _t('Editor')
  },
  {
    value: PermissionGroup.COMMENT,
    label: _t('Commenter')
  },
  {
    value: PermissionGroup.VIEW,
    label: _t('Viewer')
  }
]

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

/*******************************************************
 * FUNCTIONS
 *******************************************************/
export const calcProjectPermissions = (
  permission: number
): WorkflowPermission => {
  switch (permission) {
    case PermissionGroup.VIEW:
      return {
        ...defaultWorkflowPermissions,
        read: true
      }
    case PermissionGroup.COMMENT:
      return {
        ...defaultWorkflowPermissions,
        viewComments: true,
        addComments: true,
        read: true
      }

    case PermissionGroup.EDIT:
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
    case PermissionGroup.VIEW:
      return {
        ...defaultBasePermissions,
        read: true,
        viewComments: true,
        addComments: false
      }
    case PermissionGroup.EDIT:
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
