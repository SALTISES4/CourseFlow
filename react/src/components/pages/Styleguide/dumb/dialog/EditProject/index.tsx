import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { StyledDialog, StyledForm } from '@cfComponents/common/dialog/styles'
import ObjectSets from '@cfComponents/common/dialog/CreateProject/components/ObjectSets'

import { PropsType } from '../CreateProject'

function EditProjectDialog({
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
      <DialogTitle>{window.gettext('Edit project')}</DialogTitle>
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
            sets={state.objectSets}
            onUpdate={onObjectSetUpdate}
            onAddNew={onObjectSetAddNew}
          />
        </StyledForm>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {COURSEFLOW_APP.strings.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!!Object.keys(errors).length}
        >
          {window.gettext('Save project')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default EditProjectDialog
