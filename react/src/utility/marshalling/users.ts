import { PermissionGroup, PermissionUserType } from '@cf/types/common'
import { EUser } from '@XMLHTTP/types/entity'

export function groupUsersFromPermissionGroups({
  viewers,
  commentors,
  editors,
  students
}: {
  viewers: EUser[]
  commentors: EUser[]
  editors: EUser[]
  students: EUser[]
}): PermissionUserType[] {
  return [
    ...viewers.map((item) => {
      return {
        id: item.id,
        name: item.firstName + ' ' + item.lastName,
        email: 'plceholder@email.com',
        permissionGroup: PermissionGroup.VIEW
      }
    }),
    ...commentors.map((item) => {
      return {
        id: item.id,
        name: item.firstName + ' ' + item.lastName,
        email: 'plceholder@email.com',
        permissionGroup: PermissionGroup.COMMENT
      }
    }),
    ...editors.map((item) => {
      return {
        id: item.id,
        name: item.firstName + ' ' + item.lastName,
        email: 'plceholder@email.com',
        permissionGroup: PermissionGroup.EDIT
      }
    }),
    ...students.map((item) => {
      return {
        id: item.id,
        name: item.firstName + ' ' + item.lastName,
        email: 'plceholder@email.com',
        permissionGroup: PermissionGroup.VIEW
      }
    })
  ]
}
