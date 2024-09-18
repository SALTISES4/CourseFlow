import WorkflowEditDialog from '@cf/components/common/dialog/Workspace/WorkflowEditDialog'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import ProjectExportDialog from '@cfComponents/dialog/Workspace/ProjectExportDialog'
import ProjectTargetDialog from '@cfComponents/dialog/Workspace/ProjectTargetDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import UserRemoveFromProjectDialog from '@cfComponents/dialog/Workspace/UserRemoveFromProjectDialog'
import WorkflowLinkDialog from '@cfComponents/dialog/Workspace/WorkflowLinkDialog'
import contributorAddData from '@cfPages/Styleguide/dialog/AddContributor/data'
import ImportDialog from '@cfPages/Styleguide/dialog/Import'
import dummyProjectExportData from '@cfPages/Styleguide/dialog/ProjectExport/data'
import { projectPermission_ROLE } from '@cfPages/Styleguide/views/Project/types'

const userData = {
  id: 12313,
  name: 'Xin Yue',
  email: 'xin@xueeee.com',
  role: projectPermission_ROLE.OWNER
}



const WorkflowDialogs = () => {
  return (
    <>
      <WorkflowEditDialog />
      <RestoreDialog />
      <ProjectTargetDialog />
      <WorkflowLinkDialog />
      <ImportDialog />
      <ContributorAddDialog {...contributorAddData} />
      <ProjectExportDialog {...dummyProjectExportData} />
      <UserRemoveFromProjectDialog user={userData} />
    </>
  )
}
export default WorkflowDialogs
