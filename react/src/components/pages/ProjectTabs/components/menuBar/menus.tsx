import { calcProjectPermissions } from '@cf/utility/permissions'
import { _t } from '@cf/utility/utilityFunctions'
import { MenuItemType, MenuWithOverflow } from '@cfComponents/menu/Menu'
import { useMenuActions } from '@cfPages/ProjectTabs/hooks/useMenuActions'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useGetProjectByIdQuery } from '@XMLHTTP/API/project.rtk'
import * as React from 'react'
import { useParams } from 'react-router-dom'

const ActionMenu = () => {
  const { id } = useParams()

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data, isLoading } = useGetProjectByIdQuery({ id: Number(id) })

  const {
    openEditDialog,
    openShareDialog,
    openExportDialog,
    duplicateProject,
    archiveProject,
    unarchiveProject,
    deleteProject
  } = useMenuActions()

  if (isLoading) return <></>
  const project = data.dataPackage
  const projectPermission = calcProjectPermissions(
    project.objectPermission.permissionType
  )

  /*******************************************************
   * MODALS
   *******************************************************/

  const menuItems: MenuItemType[] = [
    {
      id: 'edit-project',
      title: _t('Edit Workflow'),
      action: openEditDialog,
      content: <EditIcon />,
      show: projectPermission.write
    },
    {
      id: 'share',
      title: _t('Sharing'),
      content: <PersonAddIcon />,
      action: openShareDialog,
      show: !projectPermission.manage
    },
    {
      id: 'export',
      content: _t('Export'),
      action: openExportDialog,
      show: projectPermission.read,
      seperator: true
    },
    // hidden
    {
      id: 'duplicate-project',
      content: _t('Copy into current project'),
      // @ts-ignore @todo what is workflowType
      action: () => duplicateProject(workflowId, projectId, workflowType),
      show: projectPermission.read
    },
    {
      id: 'archive-project',
      action: archiveProject,
      content: _t('Archive workflow'),
      show: projectPermission.manage && !project.deleted
    },
    {
      id: 'unarchive-project',
      action: unarchiveProject,
      content: _t('Restore workflow'),
      show: projectPermission.manage && project.deleted
    },
    {
      id: 'hard-delete-project',
      action: deleteProject,
      content: _t('Permanently delete workflow'),
      show: projectPermission.manage && project.deleted
    }
  ]

  return <MenuWithOverflow menuItems={menuItems} size={2} />
}

export { ActionMenu }
