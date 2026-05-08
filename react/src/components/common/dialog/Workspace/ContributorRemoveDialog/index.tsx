import {
  deleteProjectTeamMemberMutation,
  listProjectTeamQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
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
import { useMutation, useQueryClient } from '@tanstack/react-query'

const ContributorRemoveDialog = ({
  uuid,
  type: _type
}: {
  uuid: string
  type: WorkspaceType
}) => {
  const { show, onClose, payload } = useDialog<DialogMode.CONTRIBUTOR_REMOVE>(
    DialogMode.CONTRIBUTOR_REMOVE
  )
  const { onError, onSuccess } = useGenericMsgHandler()
  const queryClient = useQueryClient()

  const deleteMember = useMutation({
    ...deleteProjectTeamMemberMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: listProjectTeamQueryKey({ path: { uuid } })
      })
    }
  })

  async function onSubmit() {
    if (payload?.membershipId == null) {
      return
    }
    try {
      await deleteMember.mutateAsync({
        path: {
          uuid,
          membership_uuid: payload.membershipId
        }
      })
      onSuccess({ message: _t('Success!') })
      onClose()
    } catch (err) {
      onError(err)
    }
  }

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
