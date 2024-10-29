import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { OuterContentWrap } from '@cf/mui/helper'
import { WorkspaceType } from '@cf/types/enum'
import { _t, formatDate } from '@cf/utility/utilityFunctions'
import { AppState } from '@cfRedux/types/type'
import UserList from '@cfViews/components/workspaceOverview/UserList'
import LinkIcon from '@mui/icons-material/Link'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useSelector } from 'react-redux'

import * as SC from './styles'

const OverviewView = () => {
  const { dispatch } = useDialog()
  const data = useSelector((state: AppState) => state.workflow)
  const workflow = useSelector((state: AppState) => state.workflow)

  // @todo disciplines is missing from workflow data type
  const disciplines = []

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
   * RENDER
   *******************************************************/
  return (
    <OuterContentWrap sx={{ pt: 4 }}>
      <SC.InfoBlock>
        <SC.InfoBlockContent>{data.description}</SC.InfoBlockContent>
      </SC.InfoBlock>
      <Grid container columnSpacing={3} sx={{ mt: 3 }}>
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>Disciplines</SC.InfoBlockTitle>
            <SC.InfoBlockContent>{disciplines?.join(', ')}</SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>Created on</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {formatDate(data.createdOn)}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      </Grid>

      <SC.InfoBlock sx={{ mt: 3 }}>
        <SC.InfoBlockTitle>Permissions</SC.InfoBlockTitle>

        <UserList
          workspaceId={workflow.id}
          author={workflow.author}
          workspaceType={WorkspaceType.WORKFLOW}
        />

        <Buttons />
      </SC.InfoBlock>
    </OuterContentWrap>
  )
}

export default OverviewView
