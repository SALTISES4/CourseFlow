import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import { DIALOG_TYPE, useDialog } from '..'
import { _t } from '@cf/utility/utilityFunctions'

import { StyledDialog } from '../styles'
import { PermissionUserType } from '@cfViews/WorkflowView/componentViews/OverviewView/types'

type PropsType = {
  user: PermissionUserType | null
}

const UserRemoveFromProject = ({ user }: PropsType) => {
  const { show, onClose } = useDialog(DIALOG_TYPE.PROJECT_REMOVE_USER)

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

export default UserRemoveFromProject
