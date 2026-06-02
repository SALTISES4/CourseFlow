import { ProjectTeamRoleSchema } from '@cf/api/gen/types.gen'
import { _t } from '@cf/utility/Utility.class'

export type ProjectTeamRoleMenuOption = {
  value: ProjectTeamRoleSchema
  label: string
}

/** Menu options for project team roles (editor / commenter / viewer). */
export const projectTeamRoleMenuOptions: ProjectTeamRoleMenuOption[] = [
  {
    value: ProjectTeamRoleSchema.EDITOR,
    label: _t('Editor')
  },
  {
    value: ProjectTeamRoleSchema.COMMENTER,
    label: _t('Commenter')
  },
  {
    value: ProjectTeamRoleSchema.VIEWER,
    label: _t('Viewer')
  }
]

export function projectTeamRoleLabel(role: ProjectTeamRoleSchema): string {
  return projectTeamRoleMenuOptions.find((o) => o.value === role)?.label ?? role
}
