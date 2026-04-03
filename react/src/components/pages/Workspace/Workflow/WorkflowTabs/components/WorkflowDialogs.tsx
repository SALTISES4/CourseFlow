import WorkflowEditDialog from '@cf/components/common/dialog/Workflow/WorkflowEditDialog'
import ContributorAddDialog from '@cf/components/common/dialog/Workspace/ContributorAddDialog'
import { useTeamProjectUuidForWorkflow } from '@cf/hooks/useTeamProjectUuidForWorkflow'
import { WorkspaceType } from '@cf/types/enum'
import WorkflowCopyToProjectDialog from '@cfComponents/dialog/Workflow/WorkflowCopyToProjectDialog'
import NodeLinkWorkflowDialog from '@cfComponents/dialog/Workflow/WorkflowLinkDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useQuery } from '@tanstack/react-query'
import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { useParams } from 'react-router-dom'

const WorkflowDialogs = () => {
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''

  const { data: workflowData, refetch } = useQuery({
    ...getWorkflowOptions({
      path: { uuid: workflowUuid }
    }),
    enabled: Boolean(workflowUuid)
  })

  const { data: teamProjectUuid } = useTeamProjectUuidForWorkflow(
    workflowUuid || undefined
  )

  const contributorProjectId = teamProjectUuid ?? ''

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
        id={contributorProjectId}
        type={WorkspaceType.WORKFLOW}
        refetch={refetch}
      />
      <ContributorRemoveDialog
        id={contributorProjectId}
        type={WorkspaceType.WORKFLOW}
      />
    </>
  )
}
export default WorkflowDialogs
