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

const CourseArchiveDialog = ({ onSubmit }: PropsType) => {
  const { show, onClose } = useDialog(DIALOG_TYPE.WORKFLOW_ARCHIVE)

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="archive-course-modal"
    >
      <DialogTitle id="archive-course-modal">Archive course</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Once your [workflow-type] is archived, it won’t be visible from your
          library. You will have to navigate to your archived project to access
          it. From there, you will be able to restore your project if needed.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Archive course
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CourseArchiveDialog
