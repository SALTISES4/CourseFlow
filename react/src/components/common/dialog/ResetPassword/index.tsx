import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import { DIALOG_TYPE, useDialog } from '../'

import { StyledDialog } from '../styles'

type PropsType = {
  onSubmit: () => void
}

const ResetPasswordModal = ({ onSubmit }: PropsType) => {
  const { show, onClose } = useDialog(DIALOG_TYPE.RESET_PASSWORD)

  return (
    <StyledDialog
      open={show}
      onClose={onClose}
      maxWidth="xs"
      aria-labelledby="reset-password-modal"
    >
      <DialogTitle id="reset-password-modal">
        {COURSEFLOW_APP.strings.password_reset}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {COURSEFLOW_APP.strings.password_reset_msg}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {COURSEFLOW_APP.strings.cancel}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {COURSEFLOW_APP.strings.password_reset}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ResetPasswordModal
