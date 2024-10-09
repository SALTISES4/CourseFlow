import WorkflowEditDialog from '@cf/components/common/dialog/Workflow/WorkflowEditDialog'
import { ProjectPermissionRole } from '@cf/types/common'
import { WorkSpaceType } from '@cf/types/enum'
import ProjectExportDialog from '@cfComponents/dialog/Project/ProjectExportDialog'
import WorkflowCopyToProjectDialog from '@cfComponents/dialog/Workflow/WorkflowCopyToProjectDialog'
import WorkflowLinkDialog from '@cfComponents/dialog/Workflow/WorkflowLinkDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
// import contributorAddData from '@cfPages/Styleguide/dialog/AddContributor/data'
// import ImportDialog from '@cfPages/Styleguide/dialog/Import'
// import dummyProjectExportData from '@cfPages/Styleguide/dialog/ProjectExport/data'
// import { ProjectPermissionRole } from '@cfPages/Styleguide/views/Project/types'
import { useGetWorkflowByIdQuery } from '@XMLHTTP/API/workflow.rtk'
import { useParams } from 'react-router-dom'

import ContributorAddDialog from 'components/common/dialog/Workspace/ContributorManageDialog'

const userData = {
  id: 12313,
  name: 'Xin Yue',
  email: 'xin@xueeee.com',
  role: ProjectPermissionRole.OWNER
}

const WorkflowDialogs = () => {
  const { id } = useParams()
  const { refetch } = useGetWorkflowByIdQuery({ id: Number(id) })

  return (
    <>
      {/* Shared */}
      <RestoreDialog
        id={Number(id)}
        objectType={WorkSpaceType.WORKFLOW}
        callback={refetch}
      />
      <ArchiveDialog
        id={Number(id)}
        objectType={WorkSpaceType.WORKFLOW}
        callback={refetch}
      />
      {/* Workflow specific  */}
      <WorkflowEditDialog />

      <WorkflowCopyToProjectDialog />
      <WorkflowLinkDialog />
      {/*<ImportDialog />*/}
      {/*<ContributorAddDialog {...contributorAddData} />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
      <ContributorRemoveDialog user={userData} />
    </>
  )
}
export default WorkflowDialogs
