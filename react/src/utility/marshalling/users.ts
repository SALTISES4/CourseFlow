import { EUser } from '@XMLHTTP/types/entity'
import {
  PermissionUserType,
  PROJECT_PERMISSION_ROLE
} from '@cfPages/ProjectTabs/types'

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
        name: item.first_name + ' ' + item.last_name,
        email: 'plceholder@email.com',
        role: PROJECT_PERMISSION_ROLE.VIEWER
      }
    }),
    ...commentors.map((item) => {
      return {
        id: item.id,
        name: item.first_name + ' ' + item.last_name,
        email: 'plceholder@email.com',
        role: PROJECT_PERMISSION_ROLE.COMMENTER
      }
    }),
    ...editors.map((item) => {
      return {
        id: item.id,
        name: item.first_name + ' ' + item.last_name,
        email: 'plceholder@email.com',
        role: PROJECT_PERMISSION_ROLE.EDITOR
      }
    }),
    ...students.map((item) => {
      return {
        id: item.id,
        name: item.first_name + ' ' + item.last_name,
        email: 'plceholder@email.com',
        role: PROJECT_PERMISSION_ROLE.VIEWER
      }
    })
  ]
}
