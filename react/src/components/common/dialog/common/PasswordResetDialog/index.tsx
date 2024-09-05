import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

type PropsType = {
  onSubmit: () => void
}

const PasswordResetDialog = ({ onSubmit }: PropsType) => {
  const { show, onClose } = useDialog(DIALOG_TYPE.PASSWORD_RESET)

  return (
    <StyledDialog
      open={show}
      onClose={onClose}
      maxWidth="xs"
      aria-labelledby="reset-password-modal"
    >
      <DialogTitle id="reset-password-modal">
        {COURSEFLOW_APP.globalContextData.strings.password_reset}
      </DialogTitle>

      <DialogContent dividers>
        <Typography gutterBottom>
          {COURSEFLOW_APP.globalContextData.strings.password_reset_msg}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {COURSEFLOW_APP.globalContextData.strings.cancel}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {COURSEFLOW_APP.globalContextData.strings.password_reset}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default PasswordResetDialog
