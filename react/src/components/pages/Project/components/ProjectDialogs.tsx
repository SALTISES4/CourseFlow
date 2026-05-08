import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import ArchiveDialog from '@cf/components/common/dialog/Workspace/ArchiveDialog'
import ContributorAddDialog from '@cf/components/common/dialog/Workspace/ContributorAddDialog'
import ContributorRemoveDialog from '@cf/components/common/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cf/components/common/dialog/Workspace/RestoreDialog'
import { WorkspaceType } from '@cf/types/enum'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

const ProjectDialogs = () => {
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

  return (
    <>
      {
        // @todo fix the project edit dialog
        // <ProjectEditDialog />
      }
      <RestoreDialog
        id={projectUuid}
        objectType={WorkspaceType.PROJECT}
        callback={refetch}
      />
      <ArchiveDialog
        id={projectUuid}
        objectType={WorkspaceType.PROJECT}
        callback={refetch}
      />

      <ContributorAddDialog
        id={projectUuid}
        type={WorkspaceType.PROJECT}
        refetch={refetch}
      />
      <ContributorRemoveDialog id={projectUuid} type={WorkspaceType.PROJECT} />
      {/*<ImportDialog />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
    </>
  )
}
export default ProjectDialogs
