import { ChangeEvent, useState } from 'react'
import Alert from '@cfCommonComponents/components/Alert'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Select from '@mui/material/Select'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckIcon from '@mui/icons-material/Check'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import { DIALOG_TYPE, useDialog } from '../'
import { StyledDialog, StyledForm } from '../styles'
import ObjectSets from './components/ObjectSets'
import { TopBarProps } from '@cfModule/types/common'
import { API_POST } from '@XMLHTTP/PostFunctions'
import { produce } from 'immer'
import {SelectChangeEvent} from '@mui/material'

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
    [index: string]: string | any[]
  }
  objectSets: ObjectSetType[]
  objectSetsExpanded: boolean
}

function CreateProjectDialog({
  showNoProjectsAlert,
  formFields
}: TopBarProps['forms']['createProject']) {
  const [state, setState] = useState<StateType>({
    fields: {},
    objectSets: [],
    objectSetsExpanded: false
  })
  const [errors, setErrors] = useState({})
  const { show, onClose } = useDialog(DIALOG_TYPE.CREATE_PROJECT)
  const [selectOpenStates,setSelectOpenStates] = useState({})

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
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string | any[]>,
    field: any, // TODO
    override: any = false
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
        if(override){
          fields[field.name] = override
        }else{
          fields[field.name] = e.target.value
        }
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

  //Open or close a controlled Select component
  function handleSelectOpen(index: number, open: boolean){
    let newState = {...selectOpenStates}
    newState[index]=open;
    setSelectOpenStates(newState);
  }

  return (
    <StyledDialog open={show} onClose={onDialogClose} fullWidth maxWidth="sm">
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
            const hasError = !!errors[field.name]
            const errorText = hasError && errors[field.name][0]
            if (field.type === 'text') {
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
            }else if(field.type === 'multiselect'){
              return ([
                <InputLabel>{field.label}</InputLabel>,
                <Select 
                  key={index}
                  name={field.name}
                  required={field.required}
                  multiple
                  open={selectOpenStates[index] ?? false}
                  error={hasError}
                  value={state.fields[field.name] ?? []}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as any[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={field.options.find((option)=>option.value==value).label} 
                          clickable
                          deleteIcon={
                            <CancelIcon
                              onMouseDown={(event) => event.stopPropagation()}
                            />
                          }
                          onDelete={(event)=>{
                            let new_value = state.fields[field.name].slice() as any[]
                            new_value.splice(new_value.indexOf(value),1)
                            onInputChange(event,field,new_value)
                            event.stopPropagation()
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  onClose={()=>handleSelectOpen(index, false)}
                  onOpen={()=>handleSelectOpen(index, true)}
                  onChange={(e) => {onInputChange(e, field);handleSelectOpen(index,false)}}
                >
                  {field.options.map((option)=>(
                    <MenuItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              ])
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
          {window.gettext('Create project')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateProjectDialog
