import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { WorkspaceType } from '@cf/types/enum'
import ProjectCopyDialog from '@cfComponents/dialog/Project/ProjectCopyDialog'
import ProjectEditDialog from '@cfComponents/dialog/Project/ProjectEditDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

const ProjectDialogs = () => {
  const { uuid } = useParams()
  const projectUuid = uuid ?? ''
  const navigate = useNavigate()
  const canEdit = useResourcePermission(ProjectPermission.EDIT_PROJECT)
  const canManageMembers = useResourcePermission(
    ProjectPermission.MANAGE_MEMBERS
  )
  const canCopy = useResourcePermission(ProjectPermission.COPY_PROJECT)
  const canArchive = useResourcePermission(ProjectPermission.ARCHIVE_PROJECT)
  const canRestore = useResourcePermission(ProjectPermission.RESTORE_PROJECT)

  const { data, refetch } = useQuery({
    ...getProjectOptions({
      path: {
        uuid: projectUuid as string
      }
    }),
    enabled: Boolean(projectUuid)
  })

  return (
    <>
      {canEdit && <ProjectEditDialog />}
      {canCopy && data?.item && (
        <ProjectCopyDialog
          sourceProjectUuid={projectUuid}
          sourceProjectTitle={data.item.title}
        />
      )}
      {canRestore && (
        <RestoreDialog
          uuid={projectUuid}
          objectType={WorkspaceType.PROJECT}
          callback={refetch}
        />
      )}
      {canArchive && (
        <ArchiveDialog
          uuid={projectUuid}
          objectType={WorkspaceType.PROJECT}
          callback={() => navigate('/library')}
        />
      )}

      {canManageMembers && (
        <>
          <ContributorAddDialog
            uuid={projectUuid}
            type={WorkspaceType.PROJECT}
            refetch={refetch}
          />
          <ContributorRemoveDialog
            uuid={projectUuid}
            type={WorkspaceType.PROJECT}
          />
        </>
      )}
      {/*<ImportDialog />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
    </>
  )
}
export default ProjectDialogs
