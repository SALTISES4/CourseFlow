import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { OuterContentWrap } from '@cf/mui/helper'
import { WorkspaceType } from '@cf/types/enum'
import Utility, { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
import LinkIcon from '@mui/icons-material/Link'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useSelector } from 'react-redux'

import * as SC from './styles'
import UserPermissions from './UserPermissions'

const OverviewView = () => {
  const { dispatch } = useDialog()
  const data = useSelector((state: RootState) => state.workspace.workflow)
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  // @todo disciplines is missing from workflow data type
  const disciplines = []
  const { description, createdOn } = data

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
              {Utility.formatDate(createdOn)}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      </Grid>

      <SC.InfoBlock sx={{ mt: 3 }}>
        <SC.InfoBlockTitle>{_t('Permissionsa')}</SC.InfoBlockTitle>
        <UserPermissions
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
