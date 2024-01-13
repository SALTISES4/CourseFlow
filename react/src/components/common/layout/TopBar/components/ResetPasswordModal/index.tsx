import React from 'react'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

type PropsType = {
  show: boolean
  handleClose: () => void
  handleContinue: () => void
}

const ResetPasswordModal = ({
  show,
  handleClose,
  handleContinue
}: PropsType) => (
  <StyledDialog
    open={show}
    onClose={handleClose}
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
      <Button variant="contained" color="secondary" onClick={handleClose}>
        {COURSEFLOW_APP.strings.cancel}
      </Button>
      <Button variant="contained" onClick={handleContinue}>
        {COURSEFLOW_APP.strings.password_reset}
      </Button>
    </DialogActions>
  </StyledDialog>
)

export default ResetPasswordModal
