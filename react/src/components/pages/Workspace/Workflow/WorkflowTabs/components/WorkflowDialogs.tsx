import WorkflowEditDialog from '@cf/components/common/dialog/Workflow/WorkflowEditDialog'
import { PermissionGroup } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
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

import ContributorAddDialog from 'components/common/dialog/Workspace/ContributorAddDialog'

const userData = {
  id: 12313,
  name: 'Xin Yue',
  email: 'xin@xueeee.com',
  role: PermissionGroup.OWNER
}

const WorkflowDialogs = () => {
  const { id } = useParams()

  // @todo this is causing redux to freak out currently when you go to the workflow page
  // disable for now for sidebar integration
  // const { data, refetch } = useGetWorkflowByIdQuery({ id: Number(id) })

  return <></>

  return (
    <>
      {/* Shared */}
      <RestoreDialog
        id={Number(id)}
        objectType={WorkspaceType.WORKFLOW}
        callback={refetch}
      />
      <ArchiveDialog
        id={Number(id)}
        objectType={WorkspaceType.WORKFLOW}
        callback={refetch}
      />
      {/* Workflow specific  */}
      <WorkflowEditDialog />

      <WorkflowCopyToProjectDialog />
      <WorkflowLinkDialog />

      <ContributorRemoveDialog user={userData} />

      {/*<ImportDialog />*/}
      {/*<ContributorAddDialog {...contributorAddData} />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
    </>
  )
}
export default WorkflowDialogs
