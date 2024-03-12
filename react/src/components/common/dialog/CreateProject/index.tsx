import { ChangeEvent, useState } from 'react'
import Alert from '@cfCommonComponents/components/Alert'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { DIALOG_TYPE, useDialog } from '../'
import { StyledDialog, StyledForm } from '../styles'
import ObjectSets from './components/ObjectSets'
import { TopBarProps } from '@cfModule/types/common'
import { API_POST } from '@XMLHTTP/PostFunctions'
import { produce } from 'immer'
import { ObjectSet } from '@cfModule/types/common'

export type OnUpdateType = {
  index: number
  newVal?: ObjectSet
}

export type StateType = {
  fields: {
    [index: string]: string
  }
  objectSets: ObjectSet[]
  objectSetsExpanded: boolean
}

function CreateProjectDialog({
  showNoProjectsAlert,
  formFields
}: TopBarProps['forms']['createProject']) {
  const initialState: StateType = {
    fields: {},
    objectSets: [],
    objectSetsExpanded: false
  }
  const [state, setState] = useState<StateType>(initialState)
  const [errors, setErrors] = useState({})
  const { show, onClose } = useDialog(DIALOG_TYPE.CREATE_PROJECT)

  function onSubmit() {
    // early exit if there are validation errors
    if (Object.keys(errors).length) {
      return false
    }

    API_POST<{ redirect: string }>(
      COURSEFLOW_APP.config.json_api_paths.create_project,
      {
        ...state.fields,
        objectSets: state.objectSets
      }
    )
      .then((resp) => {
        window.location.href = resp.redirect
      })
      .catch((error) => setErrors(error.data.errors))
  }

  function onCloseAnimationEnd() {
    setState(initialState)
    setErrors({})
  }

  function onInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: any // TODO
  ) {
    if (errors[field.name]) {
      setErrors(
        produce((draft) => {
          delete draft[field.name]
        })
      )
    }

    setState(
      produce((draft) => {
        const { fields } = draft
        fields[e.target.name] = e.target.value
      })
    )
  }

  // either updating existing one
  // or deleting when no newVal is supplied
  function onObjectSetUpdate({ index, newVal }: OnUpdateType) {
    setState(
      produce((draft) => {
        const sets = draft.objectSets
        if (newVal) {
          sets.splice(index, 1, newVal)
        } else {
          sets.splice(index, 1)
        }
      })
    )
  }

  function onObjectSetAddNew() {
    setState(
      produce((draft) => {
        draft.objectSets.push({ id: '', title: '' })
      })
    )
  }

  function onObjectSetsClick() {
    setState(
      produce((draft) => {
        draft.objectSetsExpanded = !draft.objectSetsExpanded
      })
    )
  }

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
      <DialogTitle>{window.gettext('Create project')}</DialogTitle>
      <DialogContent dividers>
        <Alert sx={{ mb: 3 }} severity="warning" title="TODO - Backend" />
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
          {window.gettext('Create project')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateProjectDialog
