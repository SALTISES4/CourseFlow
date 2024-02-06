import Alert from '@cfCommonComponents/components/Alert'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { DIALOG_TYPE, useDialog } from '../'
import { StyledDialog, StyledForm } from '../styles'

type PropsType = {
  showNoProjectsAlert: boolean
}

function CreateProjectDialog({ showNoProjectsAlert }: PropsType) {
  const { show, onClose } = useDialog(DIALOG_TYPE.CREATE_PROJECT)

  // TODO: post / redirect
  function onSubmit() {
    console.log('project created?')
  }

  return (
    <StyledDialog open={show} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{window.gettext('Create project')}</DialogTitle>
      <DialogContent dividers>
        {showNoProjectsAlert && (
          <Alert
            sx={{ mb: 3 }}
            title={window.gettext('Start by creating a project')}
            subtitle={window.gettext(
              'All workflows, whether they are programs, courses, or activities, exist within projects. You must start by creating a project before proceeding to create any type of workflow.'
            )}
          />
        )}
        <StyledForm component="form">
          <TextField
            label={window.gettext('Title')}
            variant="standard"
            required
          />
          <TextField
            label={window.gettext('Description')}
            variant="standard"
            multiline
            maxRows={4}
          />
        </StyledForm>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {COURSEFLOW_APP.strings.cancel}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {window.gettext('Create project')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateProjectDialog
