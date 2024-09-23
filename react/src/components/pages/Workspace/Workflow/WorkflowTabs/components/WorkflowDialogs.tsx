import WorkflowEditDialog from '@cf/components/common/dialog/Workspace/WorkflowEditDialog'
import { WorkSpaceType } from '@cf/types/enum'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import ProjectExportDialog from '@cfComponents/dialog/Workspace/ProjectExportDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import UserRemoveFromProjectDialog from '@cfComponents/dialog/Workspace/UserRemoveFromProjectDialog'
import WorkflowCopyToProjectDialog from '@cfComponents/dialog/Workspace/WorkflowCopyToProjectDialog'
import WorkflowLinkDialog from '@cfComponents/dialog/Workspace/WorkflowLinkDialog'
import contributorAddData from '@cfPages/Styleguide/dialog/AddContributor/data'
import ArchiveDialog from '@cfPages/Styleguide/dialog/Archive'
import ImportDialog from '@cfPages/Styleguide/dialog/Import'
import dummyProjectExportData from '@cfPages/Styleguide/dialog/ProjectExport/data'
import { projectPermission_ROLE } from '@cfPages/Styleguide/views/Project/types'
import { AppState } from '@cfRedux/types/type'
import { useSelector } from 'react-redux'

const userData = {
  id: 12313,
  name: 'Xin Yue',
  email: 'xin@xueeee.com',
  role: projectPermission_ROLE.OWNER
}

const WorkflowDialogs = () => {
  const workflow = useSelector((state: AppState) => state.workflow)

  return (
    <>
      <WorkflowEditDialog />
      <RestoreDialog id={workflow.id} objectType={WorkSpaceType.WORKFLOW} />
      <ArchiveDialog id={workflow.id} objectType={WorkSpaceType.WORKFLOW} />
      <WorkflowCopyToProjectDialog />
      <WorkflowLinkDialog />
      <ImportDialog />
      <ContributorAddDialog {...contributorAddData} />
      <ProjectExportDialog {...dummyProjectExportData} />
      <UserRemoveFromProjectDialog user={userData} />
    </>
  )
}
export default WorkflowDialogs
