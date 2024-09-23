import { WorkSpaceType } from '@cf/types/enum'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import ProjectExportDialog from '@cfComponents/dialog/Workspace/ProjectExportDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import UserRemoveFromProjectDialog from '@cfComponents/dialog/Workspace/UserRemoveFromProjectDialog'
import WorkflowLinkDialog from '@cfComponents/dialog/Workspace/WorkflowLinkDialog'
import contributorAddData from '@cfPages/Styleguide/dialog/AddContributor/data'
import ArchiveDialog from '@cfPages/Styleguide/dialog/Archive'
import ImportDialog from '@cfPages/Styleguide/dialog/Import'
import dummyProjectExportData from '@cfPages/Styleguide/dialog/ProjectExport/data'
import { projectPermission_ROLE } from '@cfPages/Styleguide/views/Project/types'
import { useGetProjectByIdQuery } from '@XMLHTTP/API/project.rtk'
import { useParams } from 'react-router-dom'

const userData = {
  id: 12313,
  name: 'Xin Yue',
  email: 'xin@xueeee.com',
  role: projectPermission_ROLE.OWNER
}

const ProjectDialogs = () => {
  const { id } = useParams()
  const projectId = Number(id)
  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data, isLoading } = useGetProjectByIdQuery({ id: Number(id) })

  if (isLoading) return <></>

  return (
    <>
      <RestoreDialog objectType={WorkSpaceType.PROJECT} id={projectId} />
      <ArchiveDialog objectType={WorkSpaceType.PROJECT} id={projectId} />
      <WorkflowLinkDialog />
      <ImportDialog />
      <ContributorAddDialog {...contributorAddData} />
      <ProjectExportDialog {...dummyProjectExportData} />
      <UserRemoveFromProjectDialog user={userData} />
    </>
  )
}
export default ProjectDialogs
