import { WorkspaceType } from '@cf/types/enum'
import ProjectEditDialog from '@cfComponents/dialog/Project/ProjectEditDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useGetProjectByUuidQuery } from '@XMLHTTP/API/project.rtk'
import { useParams } from 'react-router-dom'

const ProjectDialogs = () => {
  const { uuid } = useParams()
  const projectUuid = uuid ?? ''
  const { refetch } = useGetProjectByUuidQuery(
    { projectUuid },
    { skip: !projectUuid }
  )

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
