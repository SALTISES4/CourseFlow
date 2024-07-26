import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import { DIALOG_TYPE, useDialog } from '../'

function CreateCourseDialog() {
  const { show, onClose } = useDialog(DIALOG_TYPE.COURSE_CREATE)

  return (
    <Dialog open={show} onClose={onClose}>
      <DialogTitle>Course create dialog</DialogTitle>
      <DialogContent>
        Hello from the CreateDialog, this is speaking
      </DialogContent>
    </Dialog>
  )
}

export default CreateCourseDialog
