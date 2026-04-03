import WorkflowEditDialog from '@cf/components/common/dialog/Workflow/WorkflowEditDialog'
import ContributorAddDialog from '@cf/components/common/dialog/Workspace/ContributorAddDialog'
import { WorkspaceType } from '@cf/types/enum'
import WorkflowCopyToProjectDialog from '@cfComponents/dialog/Workflow/WorkflowCopyToProjectDialog'
import NodeLinkWorkflowDialog from '@cfComponents/dialog/Workflow/WorkflowLinkDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useParams } from 'react-router-dom'

const WorkflowDialogs = () => {
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''

  // @todo replace
  const { refetch } = useGetWorkflowByUuidQuery(
    { uuid: workflowUuid },
    { skip: !workflowUuid }
  )

  return (
    <>
      {/* Shared */}
      <RestoreDialog
        id={workflowUuid}
        objectType={WorkspaceType.WORKFLOW}
        callback={refetch}
      />
      <ArchiveDialog
        id={workflowUuid}
        objectType={WorkspaceType.WORKFLOW}
        callback={refetch}
      />
      {/* Workflow specific  */}
      <WorkflowEditDialog />

      <WorkflowCopyToProjectDialog />
      <NodeLinkWorkflowDialog />
      <ContributorAddDialog
        id={workflowUuid}
        type={WorkspaceType.WORKFLOW}
        refetch={refetch}
      />
      <ContributorRemoveDialog id={workflowUuid} type={WorkspaceType.WORKFLOW} />
    </>
  )
}
export default WorkflowDialogs
