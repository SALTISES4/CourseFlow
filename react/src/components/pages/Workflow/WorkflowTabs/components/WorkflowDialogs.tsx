import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectPermission, WorkflowPermission } from '@cf/api/gen/types.gen'
import {
  useProjectPermission,
  useResourcePermission
} from '@cf/context/workspacePermissionsContext'
import { CFRoutes } from '@cf/router/appRoutes'
import { WorkspaceType } from '@cf/types/enum'
import WorkflowCopyToProjectDialog from '@cfComponents/dialog/Workflow/WorkflowCopyToProjectDialog'
import WorkflowEditDialog from '@cfComponents/dialog/Workflow/WorkflowEditDialog'
import NodeLinkWorkflowDialog from '@cfComponents/dialog/Workflow/WorkflowLinkDialog'
import ArchiveDialog from '@cfComponents/dialog/Workspace/ArchiveDialog'
import ContributorAddDialog from '@cfComponents/dialog/Workspace/ContributorAddDialog'
import ContributorRemoveDialog from '@cfComponents/dialog/Workspace/ContributorRemoveDialog'
import RestoreDialog from '@cfComponents/dialog/Workspace/RestoreDialog'
import { useQuery } from '@tanstack/react-query'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

const WorkflowDialogs = () => {
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''
  const navigate = useNavigate()
  const canRestore = useResourcePermission(WorkflowPermission.RESTORE)
  const canArchive = useResourcePermission(WorkflowPermission.ARCHIVE)
  const canEdit = useResourcePermission(WorkflowPermission.EDIT_ATTRIBUTES)
  const canCopy = useResourcePermission(WorkflowPermission.COPY)
  const canLink = useResourcePermission(WorkflowPermission.NODE_LINK_MANAGEMENT)
  const canManageMembers = useProjectPermission(
    ProjectPermission.MANAGE_MEMBERS
  )

  const { data: workflowData, refetch } = useQuery({
    ...getWorkflowOptions({
      path: { uuid: workflowUuid }
    }),
    enabled: Boolean(workflowUuid)
  })

  const contributorProjectId = workflowData?.item.projectUuid ?? ''
  const archiveDestination = contributorProjectId
    ? generatePath(CFRoutes.PROJECT_WORKFLOW, { uuid: contributorProjectId })
    : '/library'

  return (
    <>
      {/* Shared */}
      {canRestore && (
        <RestoreDialog
          uuid={workflowUuid}
          objectType={WorkspaceType.WORKFLOW}
          callback={refetch}
        />
      )}
      {canArchive && (
        <ArchiveDialog
          uuid={workflowUuid}
          objectType={WorkspaceType.WORKFLOW}
          callback={() => navigate(archiveDestination)}
        />
      )}
      {/* Workflow specific  */}
      {canEdit && <WorkflowEditDialog />}

      {canCopy && <WorkflowCopyToProjectDialog />}
      {canLink && <NodeLinkWorkflowDialog />}
      {canManageMembers && contributorProjectId && (
        <>
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
      )}
    </>
  )
}
export default WorkflowDialogs
