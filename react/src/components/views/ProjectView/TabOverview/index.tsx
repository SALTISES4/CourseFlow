import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { OuterContentWrap } from '@cf/mui/helper'
import { ProjectDetailsType } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfViews/common/workspaceOverview/styles'
import UserList from '@cfViews/common/workspaceOverview/UserList'
import Tags from '@cfViews/ProjectView/TabOverview/TagsSection'
import LinkIcon from '@mui/icons-material/Link'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useParams } from 'react-router-dom'

const OverviewTab = ({
  description,
  disciplines,
  created,
  objectSets,
  author
}: ProjectDetailsType) => {
  const { id } = useParams()
  const projectId = Number(id)
  const { dispatch } = useDialog()

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Buttons = () => (
    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
      <Button
        size="medium"
        variant="contained"
        color="secondary"
        startIcon={<LinkIcon />}
      >
        {_t('Generate public link')}
      </Button>

      <Button
        size="medium"
        variant="contained"
        onClick={() => dispatch(DialogMode.CONTRIBUTOR_ADD)}
      >
        {_t('Add contributor')}
      </Button>
    </Stack>
  )

  /*******************************************************
   * RETURN
   *******************************************************/
  return (
    <OuterContentWrap sx={{ pt: 4 }}>
      <SC.InfoBlock>
        <SC.InfoBlockTitle>{_t('Description')}</SC.InfoBlockTitle>
        <SC.InfoBlockContent>{description}</SC.InfoBlockContent>
      </SC.InfoBlock>

      <Grid container columnSpacing={3} sx={{ mt: 3 }}>
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

        <UserList
          workspaceId={projectId}
          author={author}
          workspaceType={WorkspaceType.PROJECT}
        />

        <Buttons />
      </SC.InfoBlock>

      <Tags data={objectSets} />
    </OuterContentWrap>
  )
}

export default OverviewTab
