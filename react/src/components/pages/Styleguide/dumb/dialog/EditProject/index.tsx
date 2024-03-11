import { ChangeEvent, useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { DIALOG_TYPE, useDialog } from '@cfComponents/common/dialog'
import { StyledDialog, StyledForm } from '@cfComponents/common/dialog/styles'
import ObjectSets from '@cfComponents/common/dialog/CreateProject/components/ObjectSets'
import { Discipline, FormFieldSerialized } from '@cfModule/types/common'
import { API_POST } from '@XMLHTTP/PostFunctions'
import { produce } from 'immer'
import { EProject } from '@cfModule/XMLHTTP/types/entity'

// TODO: figure out how to handle object set types and where the values come from
export enum OBJECT_SET_TYPE {
  OUTCOME = 'outcome',
  SOMETHING = 'something',
  ELSE = 'else'
}

export type ObjectSetType = {
  type: OBJECT_SET_TYPE
  label: string
}

export type OnUpdateType = {
  index: number
  newVal?: ObjectSetType
}

export type StateType = {
  fields: {
    [index: string]: string
  }
  objectSets: ObjectSetType[]
  objectSetsExpanded: boolean
}

type PropsType = {
  project?: EProject
  disciplines?: Discipline[]
  formFields: FormFieldSerialized[]
}

function EditProjectDialog({ formFields }: PropsType) {
  const [state, setState] = useState<StateType>({
    fields: {},
    objectSets: [],
    objectSetsExpanded: false
  })
  const [errors, setErrors] = useState({})
  const { show, onClose } = useDialog(DIALOG_TYPE.EDIT_PROJECT)

  function onSubmit() {
    // early exit if there are validation errors
    if (Object.keys(errors).length) {
      return false
    }

    // API_POST<{ redirect: string }>(
    //   COURSEFLOW_APP.config.json_api_paths.create_project,
    //   {
    //     ...state.fields,
    //     objectSets: state.objectSets
    //   }
    // )
    //   .then((resp) => {
    //     window.location.href = resp.redirect
    //   })
    //   .catch((error) => setErrors(error.data.errors))

    console.log('posting with', state)
  }

  function onDialogClose() {
    // clean up the state
    setState({
      fields: {},
      objectSets: [],
      objectSetsExpanded: false
    })
    setErrors({})

    // dispatch the close callback
    onClose()
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
        draft.objectSets.push({ type: '' as OBJECT_SET_TYPE, label: '' })
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
    <StyledDialog open={show} onClose={onDialogClose} fullWidth maxWidth="sm">
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
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
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
