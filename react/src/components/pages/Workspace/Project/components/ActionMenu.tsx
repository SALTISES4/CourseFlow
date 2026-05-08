import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { _t } from '@cf/utility/Utility.class'
import { MenuItemType, MenuWithOverflow } from '@cfComponents/menu/Menu'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { useMenuActions } from '../hooks/useMenuActions'

/** Until v2 exposes project ACLs, menu visibility assumes a writable project for authenticated users. */
const v2MenuPermissions = {
  read: true,
  write: true,
  manage: true,
  viewComments: true,
  addComments: true
}

const ActionMenu = () => {
  const { uuid } = useParams()
  const projectUuid = uuid ?? ''

  const { data, refetch, isLoading } = useQuery({
    ...getProjectOptions({
      path: {
        uuid: projectUuid as string
      }
    }),
    enabled: Boolean(projectUuid)
  })

  const {
    openEditDialog,
    openShareDialog,
    duplicateProject,
    archiveProject,
    unarchiveProject,
    deleteProject
  } = useMenuActions()

  if (isLoading || !data) {
    return <></>
  }

  const projectPermission = v2MenuPermissions

  const menuItems: MenuItemType[] = [
    {
      id: 'edit-project',
      title: _t('Edit project'),
      action: openEditDialog,
      iconButton: {
        icon: <EditIcon />
      },
      show: projectPermission.write
    },
    {
      id: 'share',
      title: _t('Sharing'),
      iconButton: {
        icon: <PersonAddIcon />
      },
      action: openShareDialog,
      show: projectPermission.manage
    },
    {
      id: 'duplicate-project',
      content: _t('Copy project'),
      action: () => duplicateProject(projectUuid),
      show: projectPermission.read
    },
    {
      id: 'archive-project',
      action: archiveProject,
      content: _t('Archive project'),
      show: projectPermission.manage,
      separator: 'top'
    },
    {
      id: 'unarchive-project',
      action: unarchiveProject,
      content: _t('Restore project'),
      show: false
    },
    {
      id: 'hard-delete-project',
      action: deleteProject,
      content: _t('Permanently delete workflow'),
      show: false
    }
  ]

  return (
    <MenuWithOverflow menuItems={menuItems} size={2} buttonColor="primary" />
  )
}

export default ActionMenu
