import { PermissionGroup } from '@cf/types/common'
import { _t } from '@cf/utility/Utility.class'

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
