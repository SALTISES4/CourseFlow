import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import { useDialog } from '../'
import { DIALOG_TYPE } from '../context'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

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
      <DialogTitle sx={{ m: 0, p: 2 }} id="reset-password-modal">
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
