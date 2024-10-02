import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { PermissionUserType } from '@cf/types/common'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

type PropsType = {
  user: PermissionUserType | null
}

const ContributorRemoveDialog = ({ user }: PropsType) => {
  const { show, onClose } = useDialog(DialogMode.PROJECT_REMOVE_USER)

  function onSubmit() {
    console.log('confirmed removing user:', user)
    onClose()
  }

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="remove-user-modal"
    >
      <DialogTitle id="remove-user-modal">Remove user?</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Are you sure you want to remove <strong>{user?.name}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Remove
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ContributorRemoveDialog
