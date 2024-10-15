import { calcProjectPermissions } from '@cf/utility/permissions'
import { _t } from '@cf/utility/utilityFunctions'
import { MenuItemType, MenuWithOverflow } from '@cfComponents/menu/Menu'
import { useMenuActions } from '@cfPages/Workspace/Project/hooks/useMenuActions'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useGetProjectByIdQuery } from '@XMLHTTP/API/project.rtk'
import * as React from 'react'
import { useParams } from 'react-router-dom'

const ActionMenu = () => {
  const { id } = useParams()
  const projectId = Number(id)

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data, isLoading } = useGetProjectByIdQuery({ id: projectId })

  /**
   * @todo our useMenuActions hook got really thin, so we could consider defining below functions directly here
   * instead of pulling in these function from the hook
   */
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
  const projectPermission = calcProjectPermissions(project.userPermissions)

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
      show: projectPermission.manage
    },
    {
      id: 'export',
      content: _t('Export'),
      action: openExportDialog,
      show: projectPermission.read,
      seperator: true
    },
    /**
     * Spill over menu section
     * this is dynamic in that we pass a 'split' cutoff number to the menu builder to construct what is show
     * by default and what is pushed into the dropdown
     */
    {
      id: 'duplicate-project',
      content: _t('Copy Project'),
      action: () => duplicateProject(projectId),
      show: projectPermission.read
    },
    {
      id: 'archive-project',
      action: archiveProject,
      content: _t('Archive Project'),
      show: projectPermission.manage && !project.deleted
    },
    {
      id: 'unarchive-project',
      action: unarchiveProject,
      content: _t('Restore project'),
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
