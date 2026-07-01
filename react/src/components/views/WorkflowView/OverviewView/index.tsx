import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkspaceType } from '@cf/types/enum'
import Utility, { _t } from '@cf/utility/Utility.class'
import { OuterContentWrap } from '@cfMUI/helper'
import LinkIcon from '@mui/icons-material/Link'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useQuery } from '@tanstack/react-query'
import type { EUser } from '@XMLHTTP/types/entity'
import { useParams } from 'react-router-dom'

import * as SC from './styles'
import UserPermissions from './UserPermissions'

const OverviewView = () => {
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''
  const { data: workflowResp } = useQuery({
    ...getWorkflowOptions({ path: { uuid: workflowUuid } }),
    enabled: Boolean(workflowUuid)
  })
  const workflow = workflowResp?.item
  const workflowAuthor: EUser = {
    uuid: String(workflow?.authorId ?? ''),
    username: '',
    firstName: '',
    lastName: '',
    name: '',
    email: ''
  }

  // @todo disciplines is missing from workflow data type
  const disciplines = []
  const description = workflow?.description ?? ''
  const createdOn = workflow?.dateCreated

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-overview-view">
      {description && (
        <SC.InfoBlock sx={{ mb: 3 }}>
          <SC.InfoBlockTitle>{_t('Description')}</SC.InfoBlockTitle>
          <SC.InfoBlockContent>{description}</SC.InfoBlockContent>
        </SC.InfoBlock>
      )}

      <Grid container columnSpacing={3}>
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{_t('Disciplines')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {disciplines.length
                ? disciplines?.join(', ')
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

      <SC.InfoBlock sx={{ mt: 3 }}>
        {
          // no permissions on the workflow in v1
          /* eslint-disable-next-line no-constant-binary-expression */
          false && (
            <>
              <SC.InfoBlockTitle>{_t('Permissions')}</SC.InfoBlockTitle>
              <UserPermissions
                workspaceId={workflowUuid}
                author={workflowAuthor}
                workspaceType={WorkspaceType.WORKFLOW}
              />
            </>
          )
        }

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
    </OuterContentWrap>
  )
}

export default OverviewView
