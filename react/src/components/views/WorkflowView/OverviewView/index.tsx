import { isApiErrorNotificationHandled } from '@cf/api/apiError'
import {
  getWorkflowQueryKey,
  updateWorkflowMutation,
  updateWorkflowPublicLinkMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import type { WorkflowOverviewMetadataIn } from '@cf/api/gen/types.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { CFRoutes } from '@cf/router/cfRoutes'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
import { OuterContentWrap } from '@cfMUI/helper'
import {
  type WorkflowPageData,
  isAuthenticatedWorkflow
} from '@cfPages/Workflow/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('workflow')
  const workflowUuid = workflow.uuid
  const queryClient = useQueryClient()
  const updateMetadata = useMutation(updateWorkflowMutation())
  const updatePublicLink = useMutation(updateWorkflowPublicLinkMutation())
  const canEdit = useResourcePermission(WorkflowPermission.EDIT_ATTRIBUTES)
  const authenticatedWorkflow = isAuthenticatedWorkflow(workflow)
  const canManagePublicLink = !publicView && authenticatedWorkflow && canEdit

  const description = workflow?.description ?? ''
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
      if (!isApiErrorNotificationHandled(error)) {
        enqueueSnackbar(t('messages.metadataSaveFailed'), {
          variant: SnackbarOptions.ERROR
        })
      }
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
        enabled
          ? t('messages.publicLinkEnabled')
          : t('messages.publicLinkRemoved'),
        { variant: SnackbarOptions.SUCCESS }
      )
    } catch (error) {
      if (!isApiErrorNotificationHandled(error)) {
        enqueueSnackbar(t('messages.publicLinkUpdateFailed'), {
          variant: SnackbarOptions.ERROR
        })
      }
      console.error('Failed to update workflow public link:', error)
    }
  }

  const copyPublicLink = async () => {
    const path = generatePath(CFRoutes.WORKFLOW, { uuid: workflowUuid })
    try {
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).toString()
      )
      enqueueSnackbar(t('messages.publicLinkCopied'), {
        variant: SnackbarOptions.SUCCESS
      })
    } catch (error) {
      enqueueSnackbar(t('messages.publicLinkCopyFailed'), {
        variant: SnackbarOptions.ERROR
      })
      console.error('Failed to copy workflow public link:', error)
    }
  }

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-overview-view">
      <SC.InfoBlock sx={{ mb: 3 }}>
        <SC.InfoBlockTitle>{t('overview.description')}</SC.InfoBlockTitle>
        <SC.InfoBlockContent>
          {description || t('overview.emptyValue')}
        </SC.InfoBlockContent>
      </SC.InfoBlock>

      {!publicView && authenticatedWorkflow && (
        <SC.InfoBlock sx={{ mb: 3 }} data-test-id="workflow-permissions-panel">
          <SC.InfoBlockTitle>{t('overview.permissions')}</SC.InfoBlockTitle>
          <SC.InfoBlockContent>
            <UserPermissions
              workspaceId={workflowUuid}
              owner={workflow.owner}
              workspaceType={WorkspaceType.WORKFLOW}
              projectUuid={workflow.projectUuid}
              readOnly
            />

            {/* Temporarily commented out - see COURSEFLOW-654 */}
            {/* {canManagePublicLink && (
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
                    {t('overview.copyPublicLink')}
                  </Button>
                  <Button
                    size="medium"
                    variant="outlined"
                    color="secondary"
                    startIcon={<LinkOffIcon />}
                    disabled={updatePublicLink.isPending}
                    onClick={() => setPublicLinkEnabled(false)}
                  >
                    {t('overview.removePublicLink')}
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
                  {t('overview.generatePublicLink')}
                </Button>
              )}
            </Stack>
          )} */}
          </SC.InfoBlockContent>
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
