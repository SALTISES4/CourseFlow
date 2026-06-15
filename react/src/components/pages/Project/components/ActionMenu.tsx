import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { _t } from '@cf/utility/Utility.class'
import { MenuItemType, MenuWithOverflow } from '@cfComponents/menu/Menu'
import { useMenuActions } from '@cfPages/Project/hooks/useMenuActions'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

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

  const menuItems: MenuItemType[] = [
    {
      uuid: 'edit-project',
      title: _t('Edit project'),
      action: openEditDialog,
      iconButton: {
        icon: <EditIcon />
      },
      show: true
    },
    {
      uuid: 'share',
      title: _t('Sharing'),
      iconButton: {
        icon: <PersonAddIcon />
      },
      action: openShareDialog,
      show: true
    },
    {
      uuid: 'duplicate-project',
      content: _t('Copy project'),
      action: () => duplicateProject(projectUuid),
      show: true
    },
    {
      uuid: 'archive-project',
      action: archiveProject,
      content: _t('Archive project'),
      show: true,
      separator: 'top'
    },
    {
      uuid: 'unarchive-project',
      action: unarchiveProject,
      content: _t('Restore project'),
      show: false
    },
    {
      uuid: 'hard-delete-project',
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
