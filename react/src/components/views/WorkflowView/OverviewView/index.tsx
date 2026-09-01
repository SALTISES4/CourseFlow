import {
  getWorkflowQueryKey,
  updateWorkflowMutation,
  updateWorkflowPublicLinkMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import type { WorkflowOverviewMetadataIn } from '@cf/api/gen/types.gen'
import { ResourceRole, WorkflowPermission } from '@cf/api/gen/types.gen'
import {
  useResourcePermission,
  useWorkspacePermissions
} from '@cf/context/workspacePermissionsContext'
import { CFRoutes } from '@cf/router/cfRoutes'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
import Utility, { _t } from '@cf/utility/Utility.class'
import { OuterContentWrap } from '@cfMUI/helper'
import {
  type WorkflowPageData,
  isAuthenticatedWorkflow
} from '@cfPages/Workflow/types'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { generatePath } from 'react-router-dom'

import MetadataFields from './MetadataFields'
import * as SC from './styles'
import UserPermissions from './UserPermissions'

const OverviewView = ({
  workflow,
  publicView
}: {
  workflow: WorkflowPageData
  publicView: boolean
}) => {
  const workflowUuid = workflow.uuid
  const queryClient = useQueryClient()
  const updateMetadata = useMutation(updateWorkflowMutation())
  const updatePublicLink = useMutation(updateWorkflowPublicLinkMutation())
  const canEdit = useResourcePermission(WorkflowPermission.EDIT_ATTRIBUTES)
  const { resource: permissions } = useWorkspacePermissions()
  const authenticatedWorkflow = isAuthenticatedWorkflow(workflow)
  const canManagePublicLink =
    !publicView &&
    authenticatedWorkflow &&
    [ResourceRole.OWNER, ResourceRole.EDITOR].includes(
      permissions.resourceRole as ResourceRole
    )

  // @todo disciplines is missing from workflow data type
  const disciplines: { title: string }[] = []
  const description = workflow?.description ?? ''
  const createdOn = workflow?.dateCreated
  const workflowQueryKey = getWorkflowQueryKey({ path: { uuid: workflowUuid } })

  const saveMetadata = async (updates: WorkflowOverviewMetadataIn) => {
    try {
      const response = await updateMetadata.mutateAsync({
        path: { uuid: workflowUuid },
        body: { overviewMetadata: updates }
      })
      queryClient.setQueryData(workflowQueryKey, response)
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: workflowQueryKey })
      enqueueSnackbar(_t('Workflow metadata could not be saved'), {
        variant: SnackbarOptions.ERROR
      })
      console.error('Failed to update workflow overview metadata:', error)
    }
  }

  const setPublicLinkEnabled = async (enabled: boolean) => {
    try {
      const response = await updatePublicLink.mutateAsync({
        path: { uuid: workflowUuid },
        body: { enabled }
      })
      queryClient.setQueryData(workflowQueryKey, response)
      enqueueSnackbar(
        enabled ? _t('Public link enabled') : _t('Public link removed'),
        { variant: SnackbarOptions.SUCCESS }
      )
    } catch (error) {
      enqueueSnackbar(_t('Public link could not be updated'), {
        variant: SnackbarOptions.ERROR
      })
      console.error('Failed to update workflow public link:', error)
    }
  }

  const copyPublicLink = async () => {
    const path = generatePath(CFRoutes.WORKFLOW, { uuid: workflowUuid })
    try {
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).toString()
      )
      enqueueSnackbar(_t('Public link copied'), {
        variant: SnackbarOptions.SUCCESS
      })
    } catch (error) {
      enqueueSnackbar(_t('Public link could not be copied'), {
        variant: SnackbarOptions.ERROR
      })
      console.error('Failed to copy workflow public link:', error)
    }
  }

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-overview-view">
      <SC.InfoBlock sx={{ mb: 3 }}>
        <SC.InfoBlockTitle>{_t('Description')}</SC.InfoBlockTitle>
        <SC.InfoBlockContent>{description || _t('-')}</SC.InfoBlockContent>
      </SC.InfoBlock>

      <Grid container columnSpacing={3}>
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{_t('Disciplines')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {disciplines.length
                ? disciplines.map((d) => d.title).join(', ')
                : _t('No disciplines found.')}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{_t('Created on')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {createdOn ? Utility.formatDate(createdOn) : '-'}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      </Grid>

      {!publicView && authenticatedWorkflow && (
        <SC.InfoBlock sx={{ mt: 3 }} data-test-id="workflow-permissions-panel">
          <SC.InfoBlockTitle>{_t('Permissions')}</SC.InfoBlockTitle>
          <UserPermissions
            workspaceId={workflowUuid}
            owner={workflow.owner}
            workspaceType={WorkspaceType.WORKFLOW}
            projectUuid={workflow.projectUuid}
            readOnly
          />

          {canManagePublicLink && (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="flex-end"
              sx={{ mt: 2 }}
            >
              {workflow.publicLinkEnabled ? (
                <>
                  <Button
                    size="medium"
                    variant="contained"
                    color="secondary"
                    startIcon={<ContentCopyIcon />}
                    disabled={updatePublicLink.isPending}
                    onClick={copyPublicLink}
                  >
                    {_t('Copy public link')}
                  </Button>
                  <Button
                    size="medium"
                    variant="outlined"
                    color="secondary"
                    startIcon={<LinkOffIcon />}
                    disabled={updatePublicLink.isPending}
                    onClick={() => setPublicLinkEnabled(false)}
                  >
                    {_t('Remove public link')}
                  </Button>
                </>
              ) : (
                <Button
                  size="medium"
                  variant="contained"
                  color="secondary"
                  startIcon={<LinkIcon />}
                  disabled={updatePublicLink.isPending}
                  onClick={() => setPublicLinkEnabled(true)}
                >
                  {_t('Generate public link')}
                </Button>
              )}
            </Stack>
          )}
        </SC.InfoBlock>
      )}

      {workflow && (
        <SC.InfoBlock sx={{ mb: 3 }}>
          <MetadataFields
            workflowType={workflow.workflowType}
            metadata={workflow.overviewMetadata}
            canEdit={canEdit}
            isSaving={updateMetadata.isPending}
            onSave={saveMetadata}
          />
        </SC.InfoBlock>
      )}
    </OuterContentWrap>
  )
}

export default OverviewView
