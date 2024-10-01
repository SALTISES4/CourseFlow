import Alert from '@cfPages/Styleguide/components/Alert'
import ObjectSets from '@cfPages/Styleguide/dialog/Project/components/ObjectSets'
import { StyledBox, StyledDialog } from '@cfPages/Styleguide/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

import { TInnerDialog as PropsType } from '../'

function CreateProjectDialog({
  showNoProjectsAlert,
  disciplines,
  formFields,
  state,
  errors,

  onInputChange,
  onObjectSetsClick,
  onObjectSetUpdate,
  onObjectSetAddNew,

  show,
  onClose,
  onCloseAnimationEnd,
  onSubmit
}: PropsType) {
  return (
    <StyledDialog
      open={show}
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      TransitionProps={{
        onExited: onCloseAnimationEnd
      }}
    >
      <DialogTitle>Create project</DialogTitle>
      <DialogContent dividers>
        {showNoProjectsAlert && (
          <Alert
            sx={{ mb: 3 }}
            title="Start by creating a project"
            subtitle={
              'All workflows, whether they are programs, courses, or activities, exist within projects. You must start by creating a project before proceeding to create any type of workflow.'
            }
          />
        )}
        <StyledBox component="form">
          {formFields.map((field, index) => {
            if (field.type === 'text') {
              const hasError = !!errors[field.name]
              const errorText = hasError && errors[field.name].join(' ')
              return (
                <TextField
                  key={index}
                  name={field.name}
                  label={field.label}
                  required={field.required}
                  value={state.fields[field.name] ?? ''}
                  variant="standard"
                  error={hasError}
                  helperText={hasError ? errorText : null}
                  onChange={(e) => onInputChange(e, field)}
                />
              )
            }
          })}
          <ObjectSets
            expanded={state.objectSetsExpanded}
            toggleExpanded={onObjectSetsClick}
            sets={state.objectSets || []}
            onUpdate={onObjectSetUpdate}
            onAddNew={onObjectSetAddNew}
          />
        </StyledBox>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!!Object.keys(errors).length}
        >
          Create project
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateProjectDialog
