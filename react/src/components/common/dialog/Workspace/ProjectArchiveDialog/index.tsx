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

const ProjectArchiveDialog = ({ onSubmit }: PropsType) => {
  const { show, onClose } = useDialog(DIALOG_TYPE.PROJECT_ARCHIVE)

  return (
    <StyledDialog
      open={show}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="archive-project-modal"
    >
      <DialogTitle id="archive-project-modal">
        {_t('Archive project')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {_t(
            'Once your project is archived, it won’t be visible from your library. You’ll have to navigate to your archived project to access it. From there, you’ll be able to restore your project if needed.'
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {_t('Cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {_t('Archive project')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ProjectArchiveDialog
