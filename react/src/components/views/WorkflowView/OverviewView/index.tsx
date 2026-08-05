import {
  getWorkflowOptions,
  getWorkflowQueryKey,
  updateWorkflowMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import type { WorkflowOverviewMetadataIn } from '@cf/api/gen/types.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import ErrorView from '@cf/components/pages/MsgViews/ErrorView'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
import { getErrorMessage } from '@cf/utility/errorWrapper'
import Utility, { _t } from '@cf/utility/Utility.class'
import { OuterContentWrap } from '@cfMUI/helper'
import LinkIcon from '@mui/icons-material/Link'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useParams } from 'react-router-dom'

import MetadataFields from './MetadataFields'
import * as SC from './styles'
import UserPermissions from './UserPermissions'

const OverviewView = () => {
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''
  const queryClient = useQueryClient()
  const updateMetadata = useMutation(updateWorkflowMutation())
  const canEdit = useResourcePermission(WorkflowPermission.EDIT_ATTRIBUTES)
  const {
    data: workflowResp,
    error,
    isError
  } = useQuery({
    ...getWorkflowOptions({ path: { uuid: workflowUuid } }),
    enabled: Boolean(workflowUuid)
  })

  if (isError) {
    return (
      <ErrorView message={`An error occurred: ${getErrorMessage(error)}`} />
    )
  }

  const workflow = workflowResp?.item

  if (!workflow) {
    return <ErrorView message={_t(`Workflow does not exist`)} />
  }

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

      <SC.InfoBlock sx={{ mt: 3 }} data-test-id="workflow-permissions-panel">
        <SC.InfoBlockTitle>{_t('Permissions')}</SC.InfoBlockTitle>
        <UserPermissions
          workspaceId={workflowUuid}
          owner={workflow.owner}
          workspaceType={WorkspaceType.WORKFLOW}
          projectUuid={workflow?.projectUuid}
          readOnly
        />

        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mt: 2 }}
        >
          <Button
            size="medium"
            variant="contained"
            color="secondary"
            startIcon={<LinkIcon />}
          >
            {_t('Generate public link')}
          </Button>
        </Stack>
      </SC.InfoBlock>

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
