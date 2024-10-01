import { PermissionUserType, ProjectPermissionRole } from '@cf/types/common'
import { EUser } from '@XMLHTTP/types/entity'

export function groupUsersFromRoleGroups({
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
        role: ProjectPermissionRole.VIEWER
      }
    }),
    ...commentors.map((item) => {
      return {
        id: item.id,
        name: item.firstName + ' ' + item.lastName,
        email: 'plceholder@email.com',
        role: ProjectPermissionRole.COMMENTER
      }
    }),
    ...editors.map((item) => {
      return {
        id: item.id,
        name: item.firstName + ' ' + item.lastName,
        email: 'plceholder@email.com',
        role: ProjectPermissionRole.EDITOR
      }
    }),
    ...students.map((item) => {
      return {
        id: item.id,
        name: item.firstName + ' ' + item.lastName,
        email: 'plceholder@email.com',
        role: ProjectPermissionRole.VIEWER
      }
    })
  ]
}
