import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkspaceType } from '@cf/types/enum'
import ProjectEditDialog from '@cfComponents/dialog/Project/ProjectEditDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

const ProjectDialogs = () => {
  const { uuid } = useParams()
  const projectUuid = uuid ?? ''

  const { refetch } = useQuery({
    ...getProjectOptions({
      path: {
        uuid: projectUuid as string
      }
    }),
    enabled: Boolean(projectUuid)
  })

  return (
    <>
      <ProjectEditDialog />
      <RestoreDialog
        uuid={projectUuid}
        objectType={WorkspaceType.PROJECT}
        callback={refetch}
      />
      <ArchiveDialog
        uuid={projectUuid}
        objectType={WorkspaceType.PROJECT}
        callback={refetch}
      />

      <ContributorAddDialog
        uuid={projectUuid}
        type={WorkspaceType.PROJECT}
        refetch={refetch}
      />
      <ContributorRemoveDialog
        uuid={projectUuid}
        type={WorkspaceType.PROJECT}
      />
      {/*<ImportDialog />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
    </>
  )
}
export default ProjectDialogs
