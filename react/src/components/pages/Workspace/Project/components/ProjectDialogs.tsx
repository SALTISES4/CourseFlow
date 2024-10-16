import { WorkspaceType } from '@cf/types/enum'
import ProjectEditDialog from '@cfComponents/dialog/Project/ProjectEditDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useGetProjectByIdQuery } from '@XMLHTTP/API/project.rtk'
// import ContributorAddDialog from 'components/common/dialog/Workspace/ContributorManageDialog'
import { useParams } from 'react-router-dom'

const ProjectDialogs = () => {
  const { id } = useParams()
  const projectId = Number(id)
  const { refetch } = useGetProjectByIdQuery({ id: Number(id) })

  return (
    <>
      <ProjectEditDialog />
      <RestoreDialog
        id={projectId}
        objectType={WorkspaceType.PROJECT}
        callback={refetch}
      />
      <ArchiveDialog
        id={projectId}
        objectType={WorkspaceType.PROJECT}
        callback={refetch}
      />

      <ContributorAddDialog
        id={projectId}
        type={WorkspaceType.PROJECT}
        refetch={refetch}
      />
      <ContributorRemoveDialog id={projectId} type={WorkspaceType.PROJECT} />
      {/*<ImportDialog />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
    </>
  )
}
export default ProjectDialogs
