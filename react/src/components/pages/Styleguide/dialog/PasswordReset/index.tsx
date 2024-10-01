import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

import { StyledDialog } from '../styles'

type PropsType = {
  onSubmit: () => void
}

const ResetPasswordModal = ({ onSubmit }: PropsType) => {
  const { show, onClose } = useDialog(DialogMode.PASSWORD_RESET)

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      maxWidth="xs"
      aria-labelledby="reset-password-modal"
    >
      <DialogTitle id="reset-password-modal">Reset password</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Sunt maiores
          quibusdam quidem eligendi consectetur. Culpa, totam. Tempora fuga
          optio fugiat ex adipisci voluptatibus, voluptas a molestiae
          distinctio, fugit quibusdam sit!
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Reset password
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ResetPasswordModal
