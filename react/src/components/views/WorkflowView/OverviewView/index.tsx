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
import { useReferenceLabels } from '@cf/i18n/referenceLabels'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
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
import { useTranslation } from 'react-i18next'

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
  const { locale } = useReferenceLabels()
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
      enqueueSnackbar(t('messages.metadataSaveFailed'), {
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
        enabled ? t('messages.publicLinkEnabled') : t('messages.publicLinkRemoved'),
        { variant: SnackbarOptions.SUCCESS }
      )
    } catch (error) {
      enqueueSnackbar(t('messages.publicLinkUpdateFailed'), {
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
        <SC.InfoBlockContent>{description || t('overview.emptyValue')}</SC.InfoBlockContent>
      </SC.InfoBlock>

      <Grid container columnSpacing={3}>
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{t('overview.disciplines')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {disciplines.length
                ? disciplines.map((d) => d.title).join(', ')
                : t('overview.noDisciplines')}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{t('overview.createdOn')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {createdOn
                ? new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }).format(new Date(createdOn))
                : t('overview.emptyValue')}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      </Grid>

      {!publicView && authenticatedWorkflow && (
        <SC.InfoBlock sx={{ mt: 3 }} data-test-id="workflow-permissions-panel">
          <SC.InfoBlockTitle>{t('overview.permissions')}</SC.InfoBlockTitle>
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
