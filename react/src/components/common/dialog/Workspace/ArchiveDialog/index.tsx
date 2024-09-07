import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

const ArchiveDialog = () => {
  const { type, show, onClose } = useDialog([
    DIALOG_TYPE.PROJECT_ARCHIVE,
    DIALOG_TYPE.COURSE_ARCHIVE
  ])

  let resourceType = ''
  switch (type) {
    case DIALOG_TYPE.PROJECT_ARCHIVE:
      resourceType = 'project'
      break
    case DIALOG_TYPE.COURSE_ARCHIVE:
      resourceType = 'course'
      break
  }

  function onSubmit() {
    console.log('submitting', type)
  }

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={`archive-${resourceType}-modal`}
    >
      <DialogTitle id={`archive-${resourceType}-modal`}>
        Archive {resourceType}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Once your {resourceType} is archived, it won’t be visible from your
          library. You will have to navigate to your archived project to access
          it. From there, you will be able to restore your project if needed.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Archive {resourceType}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ArchiveDialog
