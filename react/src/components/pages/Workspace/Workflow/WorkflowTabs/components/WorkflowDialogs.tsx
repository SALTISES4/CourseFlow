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
  const { refetch } = useGetWorkflowByIdQuery({ id: workflowId })

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
      <ContributorAddDialog
        id={workflowId}
        type={WorkspaceType.WORKFLOW}
        refetch={refetch}
      />
      <ContributorRemoveDialog id={workflowId} type={WorkspaceType.WORKFLOW} />
      {/*
        @todo: still to implement
      */}
      {/*<ImportDialog />*/}
      {/*<ProjectExportDialog {...dummyProjectExportData} />*/}
    </>
  )
}
export default WorkflowDialogs
