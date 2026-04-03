import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { WorkspaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { EmptyPostResp } from '@XMLHTTP/types/query'

const ContributorRemoveDialog = ({
  id,
  type
}: {
  id: string
  type: WorkspaceType
}) => {
  const { show, onClose, payload } = useDialog<DialogMode.CONTRIBUTOR_REMOVE>(
    DialogMode.CONTRIBUTOR_REMOVE
  )
  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * QUERIES
   *******************************************************/
  // @todo replace
  const [mutate] = useWorkspaceUserDeleteMutation()

  // @todo replace
  const { refetch } = useGetUsersForObjectQuery({
    id,
    payload: {
      objectType: type
    }
  })

  /*******************************************************
   * FUNCTION
   *******************************************************/

  function successHandler(response: EmptyPostResp) {
    onSuccess(response)
    onClose()
    refetch()
  }

  // @todo replace
  async function onSubmit() {
    const args: WorkspaceDeleteUserArgs = {
      id: string(id),
      payload: {
        userId: payload.userId,
        type
      }
    }

    try {
      const response = await mutate(args).unwrap()
      successHandler(response)
    } catch (err) {
      onError(err)
    }
  }

  /*******************************************************
   *
   *******************************************************/
  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="remove-user-modal"
    >
      <DialogTitle id="remove-user-modal">{_t('Remove user?')}</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {_t('Are you sure you want to remove')}{' '}
          <strong>{payload?.username}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {_t('Cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {_t('Remove')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ContributorRemoveDialog
