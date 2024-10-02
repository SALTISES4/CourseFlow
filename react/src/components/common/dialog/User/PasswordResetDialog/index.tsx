import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { apiPaths } from '@cf/router/apiRoutes'
import strings from '@cf/utility/strings'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'

const PasswordResetDialog = () => {
  const { show, onClose } = useDialog(DialogMode.PASSWORD_RESET)
  const navigate = useNavigate()

  function onSubmit() {
    navigate(apiPaths.external.resetPasswordUrl, {
      replace: true
    })
  }

  return (
    <StyledDialog
      open={show}
      onClose={onClose}
      maxWidth="xs"
      aria-labelledby="reset-password-modal"
    >
      <DialogTitle id="reset-password-modal">
        {strings.passwordReset}
      </DialogTitle>

      <DialogContent dividers>
        <Typography gutterBottom>{strings.passwordResetMsg}</Typography>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {strings.cancel}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {strings.passwordReset}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default PasswordResetDialog
