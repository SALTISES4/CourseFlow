import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import { DIALOG_TYPE, useDialog } from  '@cf/hooks/useDialog'

import { StyledDialog } from '../styles'

type PropsType = {
  onSubmit: () => void
}

const ArchiveProjectModal = ({ onSubmit }: PropsType) => {
  const { show, onClose } = useDialog(DIALOG_TYPE.PROJECT_ARCHIVE)

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="archive-project-modal"
    >
      <DialogTitle id="archive-project-modal">Archive project</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Once your project is archived, it won’t be visible from your library.
          You’ll have to navigate to your archived project to access it. From
          there, you’ll be able to restore your project if needed.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Archive project
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ArchiveProjectModal
