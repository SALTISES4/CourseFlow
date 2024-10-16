import WorkflowEditDialog from '@cf/components/common/dialog/Workflow/WorkflowEditDialog'
import ContributorAddDialog from '@cf/components/common/dialog/Workspace/ContributorAddDialog'
import { WorkspaceType } from '@cf/types/enum'
import WorkflowCopyToProjectDialog from '@cfComponents/dialog/Workflow/WorkflowCopyToProjectDialog'
import WorkflowLinkDialog from '@cfComponents/dialog/Workflow/WorkflowLinkDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useGetWorkflowByIdQuery } from '@XMLHTTP/API/workflow.rtk'
import { useParams } from 'react-router-dom'

const WorkflowDialogs = () => {
  const { id } = useParams()
  const workflowId = Number(id)

  // @todo this is causing redux to freak out currently when you go to the workflow page
  // disable for now for sidebar integration
    // const { refetch } = useGetWorkflowByIdQuery({ id: Number(id) })

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

      {/*<ImportDialog />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
      <ContributorAddDialog
        id={workflowId}
        type={WorkspaceType.WORKFLOW}
        refetch={refetch}
      />
      <ContributorRemoveDialog id={workflowId} type={WorkspaceType.WORKFLOW} />
    </>
  )
}
export default WorkflowDialogs
