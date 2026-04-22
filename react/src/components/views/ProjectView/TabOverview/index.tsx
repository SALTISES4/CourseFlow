import { ProjectDetailsType } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { OuterContentWrap } from '@cfMUI/helper'
import Tags from '@cfViews/ProjectView/TabOverview/TagsSection'
import * as SC from '@cfViews/WorkflowView/OverviewView/styles'
import UserPermissions from '@cfViews/WorkflowView/OverviewView/UserPermissions'
import LinkIcon from '@mui/icons-material/Link'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useParams } from 'react-router-dom'

const OverviewTab = ({
  description,
  disciplines,
  created,
  tags,
  author
}: ProjectDetailsType) => {
  const { uuid } = useParams()
  const projectUuid = uuid

  return (
    <OuterContentWrap sx={{ pt: 4 }}>
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
            <SC.InfoBlockContent>{String(created)}</SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      </Grid>

      <SC.InfoBlock sx={{ mt: 3 }}>
        <SC.InfoBlockTitle>{_t('Permissions')}</SC.InfoBlockTitle>

        <UserPermissions
          workspaceId={projectUuid ?? ''}
          author={author}
          workspaceType={WorkspaceType.PROJECT}
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

      <Tags data={tags} />
    </OuterContentWrap>
  )
}

export default OverviewTab
