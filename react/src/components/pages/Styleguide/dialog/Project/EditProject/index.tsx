import ObjectSets from '@cfPages/Styleguide/dialog/Project/components/ObjectSets'
import { StyledDialog, StyledForm } from '@cfPages/Styleguide/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

import { TInnerDialog as PropsType } from '../'

function EditProjectDialog({
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
      <DialogTitle>Edit project</DialogTitle>
      <DialogContent dividers>
        <StyledForm component="form">
          {formFields.map((field, index) => {
            if (field.type === 'text') {
              const hasError = !!errors[field.name]
              const errorText = hasError && errors[field.name][0]

              return (
                <TextField
                  key={index}
                  name={field.name}
                  label={field.label}
                  required={field.required}
                  value={state.fields[field.name] ?? ''}
                  variant="standard"
                  error={hasError}
                  helperText={errorText}
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
        </StyledForm>
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
          Save project
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default EditProjectDialog
