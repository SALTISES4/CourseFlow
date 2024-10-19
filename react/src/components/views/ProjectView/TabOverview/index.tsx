import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { OuterContentWrap } from '@cf/mui/helper'
import { ProjectDetailsType } from '@cf/types/common'
import { _t } from '@cf/utility/utilityFunctions'
import { WorkspaceType } from '@cfPages/Workspace/Workflow/types'
import UserList from '@cfViews/components/workspaceOverview/UserList'
import LinkIcon from '@mui/icons-material/Link'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import * as SC from 'components/views/components/workspaceOverview/styles'
import { useParams } from 'react-router-dom'

import { ObjectSetThumbnail } from './styles'

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

  const ObjectSets = () => {
    if (!objectSets) return <></>
    return (
      <SC.InfoBlock sx={{ mt: 3 }}>
        <SC.InfoBlockTitle>{_t('Object sets')}</SC.InfoBlockTitle>

        <SC.InfoBlockContent sx={{ mt: 0 }}>
          <Grid container columnSpacing={3}>
            {objectSets.map((set, idx) => (
              <Grid item key={idx} xs={6}>
                <ObjectSetThumbnail>
                  <Typography variant="body1">{set.title}</Typography>
                  <Typography variant="body2">{set.term}</Typography>
                </ObjectSetThumbnail>
              </Grid>
            ))}
          </Grid>
        </SC.InfoBlockContent>
      </SC.InfoBlock>
    )
  }

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

      <ObjectSets />
    </OuterContentWrap>
  )
}

export default OverviewTab
