import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import { DIALOG_TYPE, useDialog } from '../'

function CreateActivityDialog() {
  const { show, onClose } = useDialog(DIALOG_TYPE.ACTIVITY_CREATE)
  return (
    <Dialog open={show} onClose={onClose}>
      <DialogTitle>Activity dialog</DialogTitle>
      <DialogContent>
        Hello from the CreateDialog, this is speaking
      </DialogContent>
    </Dialog>
  )
}

export default CreateActivityDialog
