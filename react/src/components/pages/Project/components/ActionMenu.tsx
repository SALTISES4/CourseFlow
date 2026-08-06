import { ProjectPermission } from '@cf/api/gen'
import {
  hasPermission,
  useWorkspacePermissions
} from '@cf/context/workspacePermissionsContext'
import { _t } from '@cf/utility/Utility.class'
import { MenuItemType, MenuWithOverflow } from '@cfComponents/menu/Menu'
import { useMenuActions } from '@cfPages/Project/hooks/useMenuActions'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useParams } from 'react-router-dom'

const ActionMenu = () => {
  const { uuid } = useParams()
  const projectUuid = uuid ?? ''
  const { resource: permissions } = useWorkspacePermissions()
  const isArchived = permissions.state === 'archived'

  const {
    openEditDialog,
    openShareDialog,
    duplicateProject,
    archiveProject,
    unarchiveProject,
    deleteProject
  } = useMenuActions()

  const menuItems: MenuItemType[] = [
    {
      uuid: 'edit-project',
      title: _t('Edit project'),
      action: openEditDialog,
      iconButton: {
        icon: <EditIcon />
      },
      show:
        !isArchived &&
        hasPermission(permissions, ProjectPermission.EDIT_PROJECT)
    },
    {
      uuid: 'share',
      title: _t('Sharing'),
      iconButton: {
        icon: <PersonAddIcon />
      },
      action: openShareDialog,
      show:
        !isArchived &&
        hasPermission(permissions, ProjectPermission.MANAGE_MEMBERS)
    },
    {
      uuid: 'duplicate-project',
      content: _t('Copy project'),
      action: () => duplicateProject(projectUuid),
      show: false
    },
    {
      uuid: 'archive-project',
      action: archiveProject,
      content: _t('Archive project'),
      show:
        !isArchived &&
        hasPermission(permissions, ProjectPermission.ARCHIVE_PROJECT)
    },
    {
      uuid: 'unarchive-project',
      action: unarchiveProject,
      content: _t('Restore project'),
      show:
        isArchived &&
        hasPermission(permissions, ProjectPermission.RESTORE_PROJECT)
    },
    {
      uuid: 'hard-delete-project',
      action: deleteProject,
      content: _t('Permanently delete project'),
      show:
        isArchived &&
        hasPermission(permissions, ProjectPermission.DELETE_PROJECT)
    }
  ]

  if (menuItems.every((i) => !i.show)) {
    return null
  }

  return (
    <MenuWithOverflow menuItems={menuItems} size={2} buttonColor="primary" />
  )
}

export default ActionMenu
