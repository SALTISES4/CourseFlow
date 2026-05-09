import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import WorkflowCopyToProjectDialog from '@cf/components/common/dialog/Workflow/WorkflowCopyToProjectDialog'
import WorkflowEditDialog from '@cf/components/common/dialog/Workflow/WorkflowEditDialog'
import NodeLinkWorkflowDialog from '@cf/components/common/dialog/Workflow/WorkflowLinkDialog'
import ArchiveDialog from '@cf/components/common/dialog/Workspace/ArchiveDialog'
import ContributorAddDialog from '@cf/components/common/dialog/Workspace/ContributorAddDialog'
import ContributorRemoveDialog from '@cf/components/common/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cf/components/common/dialog/Workspace/RestoreDialog'
import { useTeamProjectUuidForWorkflow } from '@cf/hooks/useTeamProjectUuidForWorkflow'
import { WorkspaceType } from '@cf/types/enum'
import { useQuery } from '@tanstack/react-query'
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
        uuid={workflowUuid}
        objectType={WorkspaceType.WORKFLOW}
        callback={refetch}
      />
      <ArchiveDialog
        uuid={workflowUuid}
        objectType={WorkspaceType.WORKFLOW}
        callback={refetch}
      />
      {/* Workflow specific  */}
      <WorkflowEditDialog />

      <WorkflowCopyToProjectDialog />
      <NodeLinkWorkflowDialog />
      <ContributorAddDialog
        uuid={contributorProjectId}
        type={WorkspaceType.WORKFLOW}
        refetch={refetch}
      />
      <ContributorRemoveDialog
        uuid={contributorProjectId}
        type={WorkspaceType.WORKFLOW}
      />
    </>
  )
}
export default WorkflowDialogs
