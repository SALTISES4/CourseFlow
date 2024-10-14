import { WorkspaceType } from '@cf/types/enum'
import ProjectEditDialog from '@cfComponents/dialog/Project/ProjectEditDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useGetProjectByIdQuery } from '@XMLHTTP/API/project.rtk'
import { useParams } from 'react-router-dom'

import ContributorAddDialog from 'components/common/dialog/Workspace/ContributorAddDialog'

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
      {/*<ImportDialog />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
      <ContributorAddDialog id={projectId} type={WorkspaceType.PROJECT} />
      <ContributorRemoveDialog id={projectId} type={WorkspaceType.PROJECT} />
    </>
  )
}
export default ProjectDialogs
