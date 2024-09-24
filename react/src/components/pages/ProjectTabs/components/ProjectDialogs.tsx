import { WorkSpaceType } from '@cf/types/enum'
import ProjectEditDialog from '@cfComponents/dialog/Project/ProjectEditDialog'
import ProjectExportDialog from '@cfComponents/dialog/Project/ProjectExportDialog'
import UserRemoveFromProjectDialog from '@cfComponents/dialog/Project/UserRemoveFromProjectDialog'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
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

const formFields = [
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    value: '',
    required: true
  },
  {
    name: 'description',
    label: 'Description',
    type: 'text',
    value: ''
  }
]

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
      <ProjectEditDialog formFields={formFields} showNoProjectsAlert={true}/>
      <RestoreDialog objectType={WorkSpaceType.PROJECT} id={projectId} />
      <ArchiveDialog objectType={WorkSpaceType.PROJECT} id={projectId} />
      <ImportDialog />
      <ContributorAddDialog {...contributorAddData} />
      <ProjectExportDialog {...dummyProjectExportData} />
      <UserRemoveFromProjectDialog user={userData} />
    </>
  )
}
export default ProjectDialogs
