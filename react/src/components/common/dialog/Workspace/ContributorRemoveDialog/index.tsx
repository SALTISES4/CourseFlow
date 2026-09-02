import {
  deleteProjectTeamMemberMutation,
  listProjectTeamQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'

// @todo is this used?
const ContributorRemoveDialog = ({
  uuid,
  type: _type
}: {
  uuid: string
  type: WorkspaceType
}) => {
  const { t } = useTranslation('workspace')
  const { t: tCommon } = useTranslation('common')
  const { show, onClose, payload } = useDialog<DialogMode.CONTRIBUTOR_REMOVE>(
    DialogMode.CONTRIBUTOR_REMOVE
  )
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
          membership_id: payload.membershipId
        }
      })
      enqueueSnackbar(
        t('contributor.removed'),
        { variant: SnackbarOptions.SUCCESS }
      )
      onClose()
    } catch (err) {
      enqueueSnackbar(
        t('contributor.removeFailed'),
        { variant: SnackbarOptions.ERROR }
      )
      console.error('Failed to remove contributor:', err)
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
      <DialogTitle id="remove-user-modal">{t('contributor.removeTitle')}</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {t('contributor.removeConfirmation', {
            name: payload?.username ?? ''
          })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {tCommon('actions.cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {tCommon('actions.remove')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ContributorRemoveDialog
