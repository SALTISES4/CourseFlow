import { StyledDialog, StyledForm } from '@cf/components/common/dialog/styles'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { TopBarProps } from '@cf/types/common'
import strings from '@cf/utility/strings'
import { _t } from '@cf/utility/utilityFunctions'
import Alert from '@cfComponents/UIPrimitives/Alert'
import CancelIcon from '@mui/icons-material/Cancel'
import { SelectChangeEvent } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { useCreateProjectMutation } from '@XMLHTTP/API/project.rtk'
import { CreateProjectArgs } from '@XMLHTTP/types/args'
import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import { ChangeEvent, useEffect, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import ObjectSets from './components/ObjectSets'
import { OBJECT_SET_TYPE, ObjectSetType } from './type'

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

/**
 *
 * @param showNoProjectsAlert
 * @param formFields
 * @constructor
 */
const ProjectEditDialog = ({
  showNoProjectsAlert,
  formFields
}: TopBarProps['forms']['createProject']) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const [state, setState] = useState<StateType>({
    fields: {},
    objectSets: [],
    objectSetsExpanded: false
  })
  const [errors, setErrors] = useState({})
  const { show, onClose } = useDialog([
    DIALOG_TYPE.PROJECT_CREATE,
    DIALOG_TYPE.PROJECT_EDIT
  ])
  const [selectOpenStates, setSelectOpenStates] = useState({})
  const navigate = useNavigate()

  /*******************************************************
   * QUERY HOOK
   *******************************************************/
  const [mutate, { isSuccess, isError, error, data: updateData }] =
    useCreateProjectMutation()

  useEffect(() => {
    if (isSuccess) {
      onSuccess(String(updateData.dataPackage.id))
    }
    if (isError) {
      onError(error)
    }
  }, [isSuccess, isError, updateData, error])

  function onSuccess(id: string) {
    const path = generatePath(CFRoutes.PROJECT, {
      id
    })
    onDialogClose()
    navigate(path)
    enqueueSnackbar('created project success', {
      variant: 'success'
    })
  }

  function onError(error) {
    enqueueSnackbar('created project error', {
      variant: 'error'
    })
    // this won't work because we're getting back errors from the serializer
    // but it's a start
    console.error('Error creating project:', error)
    // setErrors(error.name)
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function onSubmit() {
    // early exit if there are validation errors
    if (Object.keys(errors).length) {
      return false
    }

    // remove empty values
    const payLoad = {
      ...state.fields,
      objectSets: state.objectSets.filter(
        (item) => item.term !== '' && item.title !== ''
      )
      // we're asserting that this is CreateProjectArgs because we passed form validation but
      // there has to be a better way to do this
    } as CreateProjectArgs

    mutate(payLoad)
  }

  function onDialogClose() {
    // clean up the state
    setState({
      fields: {},
      objectSets: [],
      objectSetsExpanded: false
    })
    setErrors({})

    onClose()
  }

  function onInputChange(
    e:
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string | any[]>,
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
        if (override) {
          fields[field.name] = override
        } else {
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
        draft.objectSets.push({ term: '' as OBJECT_SET_TYPE, title: '' })
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

  // Open or close a controlled Select component
  function handleSelectOpen(index: number, open: boolean) {
    const newState = { ...selectOpenStates }
    newState[index] = open
    setSelectOpenStates(newState)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <StyledDialog open={show} onClose={onDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>{_t('Create project')}</DialogTitle>
      <DialogContent dividers>
        {showNoProjectsAlert && (
          <Alert
            sx={{ mb: 3 }}
            title={_t('Start by creating a project')}
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
            }

            if (field.type === 'multiselect') {
              return (
                <FormControl key={index} fullWidth>
                  <InputLabel id="create-project-discipline">
                    {field.label}
                  </InputLabel>
                  <Select
                    labelId="create-project-discipline"
                    label={field.label}
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
                            label={
                              field.options.find(
                                (option) => option.value == value
                              ).label
                            }
                            clickable
                            deleteIcon={
                              <CancelIcon
                                onMouseDown={(event) => event.stopPropagation()}
                              />
                            }
                            onDelete={(event) => {
                              const newValue = state.fields[
                                field.name
                              ].slice() as any[]
                              newValue.splice(newValue.indexOf(value), 1)
                              onInputChange(event, field, newValue)
                              event.stopPropagation()
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    onClose={() => handleSelectOpen(index, false)}
                    onOpen={() => handleSelectOpen(index, true)}
                    onChange={(e) => {
                      onInputChange(e, field)
                      handleSelectOpen(index, false)
                    }}
                  >
                    {field.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )
            }
          })}
          <ObjectSets
            expanded={state.objectSetsExpanded}
            toggleExpanded={onObjectSetsClick}
            objectSets={state.objectSets}
            onUpdate={onObjectSetUpdate}
            onAddNew={onObjectSetAddNew}
          />
        </StyledForm>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
          {strings.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!!Object.keys(errors).length}
        >
          {_t('Create project')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ProjectEditDialog
