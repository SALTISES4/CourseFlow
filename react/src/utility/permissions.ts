import { ProjectTeamRoleSchema } from '@cf/api/gen/types.gen'
import type { TFunction } from 'i18next'

export type ProjectTeamRoleMenuOption = {
  value: ProjectTeamRoleSchema
  label: string
}

/** Menu options for project team roles (editor / commenter / viewer). */
export function projectTeamRoleMenuOptions(
  t: TFunction<'workspace'>
): ProjectTeamRoleMenuOption[] {
  return [
    { value: ProjectTeamRoleSchema.EDITOR, label: t('roles.editor') },
    { value: ProjectTeamRoleSchema.COMMENTER, label: t('roles.commenter') },
    { value: ProjectTeamRoleSchema.VIEWER, label: t('roles.viewer') }
  ]
}

export function projectTeamRoleLabel(
  role: ProjectTeamRoleSchema,
  t: TFunction<'workspace'>
): string {
  return projectTeamRoleMenuOptions(t).find((o) => o.value === role)?.label ?? role
}
