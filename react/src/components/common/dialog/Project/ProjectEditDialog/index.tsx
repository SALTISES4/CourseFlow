import * as SC from '@cf/components/common/dialog/styles'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import appRoutes, { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { StyledBox } from '@cfPages/Styleguide/dialog/styles'
import CancelIcon from '@mui/icons-material/Cancel'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { useCreateProjectMutation } from '@XMLHTTP/API/project.rtk'
import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import { useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { generatePath, useNavigate } from 'react-router-dom'

import ObjectSets from './components/ObjectSets'
import { OBJECT_SET_TYPE, ObjectSetType } from './type'

export type OnUpdateType = {
  index: number
  newVal?: ObjectSetType
}

export type StateType = {
  objectSets: ObjectSetType[]
  objectSetsExpanded: boolean
}

function getFormConfig() {
  return {
    showNoProjectsAlert: true,
    formFields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        options: null,
        max_length: 200,
        help_text: '',
        value: 'New project name'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        required: false,
        options: null,
        max_length: null,
        help_text: '',
        value: ''
      },
      {
        name: 'disciplines',
        label: 'Discipline',
        type: 'multiselect',
        required: false,
        options: [
          {
            label: 'Physics',
            value: '1'
          },
          {
            label: 'Chemistry',
            value: '2'
          },
          {
            label: 'Biology',
            value: '3'
          },
          {
            label: 'Environmental Science',
            value: '4'
          },
          {
            label: 'Science (General)',
            value: '5'
          },
          {
            label: 'Mathematics',
            value: '6'
          },
          {
            label: 'Philosophy',
            value: '7'
          },
          {
            label: 'Computer Science',
            value: '8'
          },
          {
            label: 'Engineering',
            value: '9'
          },
          {
            label: 'Anthropology',
            value: '10'
          },
          {
            label: 'Economics',
            value: '11'
          },
          {
            label: 'Geography',
            value: '12'
          },
          {
            label: 'Political Science',
            value: '13'
          },
          {
            label: 'Psychology',
            value: '14'
          },
          {
            label: 'Sociology',
            value: '15'
          },
          {
            label: 'Social Work',
            value: '16'
          },
          {
            label: 'Social Sciences (General)',
            value: '17'
          },
          {
            label: 'Performing Arts',
            value: '18'
          },
          {
            label: 'Visual Arts',
            value: '19'
          },
          {
            label: 'History',
            value: '20'
          },
          {
            label: 'Literature',
            value: '21'
          },
          {
            label: 'Law',
            value: '22'
          },
          {
            label: 'Theology',
            value: '23'
          },
          {
            label: 'Humanities (General)',
            value: '24'
          },
          {
            label: 'Medicine',
            value: '25'
          },
          {
            label: 'Nursing',
            value: '26'
          },
          {
            label: 'Business',
            value: '27'
          },
          {
            label: 'English',
            value: '28'
          },
          {
            label: 'French',
            value: '29'
          },
          {
            label: 'Languages',
            value: '30'
          },
          {
            label: 'Design',
            value: '31'
          },
          {
            label: 'Other',
            value: '32'
          }
        ],
        max_length: null,
        help_text: '',
        value: []
      }
    ]
  }
}

type ProjectFormValues = {
  title: string
  description: string
  disciplines: string[]
  objectSets: ObjectSetType[]
}
/**
 *
 * @param showNoProjectsAlert
 * @param formFields
 * @constructor
 */
const ProjectEditDialog = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { show, onClose } = useDialog(DIALOG_TYPE.PROJECT_EDIT)

  const config = getFormConfig()

  const [state, setState] = useState<StateType>({
    objectSets: [],
    objectSetsExpanded: false
  })
  // const [errors, setErrors] = useState({})

  const [selectOpenStates, setSelectOpenStates] = useState({})
  const navigate = useNavigate()

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    getValues,
    reset
  } = useForm<ProjectFormValues>({
    defaultValues: {
      title: '',
      description: '',
      disciplines: [],
      objectSets: [] // Assuming object sets are part of the form
    }
  })

  const {
    fields: objectSetsFields,
    append,
    remove,
    update
  } = useFieldArray({
    control,
    name: 'objectSets'
  })

  /*******************************************************
   * QUERY HOOK
   *******************************************************/
  const [createProject, { isSuccess, isError, error, data: updateData }] =
    useCreateProjectMutation()

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


  const vals = getValues()
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const onSubmit = (data: ProjectFormValues) => {
    // remove null values
    const filteredObjectSets = data.objectSets
      .filter((set) => set.term && set.title)
      .map((item) => ({
        title: item.title,
        type: item.term
      }))
    const payload = {
      ...data,
      disciplines: data.disciplines.map((item) => Number(item)),
      objectSets: filteredObjectSets
    }

    createProject(payload)
      .unwrap()
      .then((response) => {
        onSuccess(String(response.dataPackage.id))
      })
      .catch((err) => {
        onError(error)
      })
  }

  function onDialogClose() {
    reset()
    onClose()
  }

  // either updating existing one
  // or deleting when no newVal is supplied
  function onObjectSetUpdate({ index, newVal }: OnUpdateType) {
    setState(
      produce((draft) => {
        const sets = draft.objectSets
        if (newVal) {
          update(index, newVal) // Update object set in the array
          sets.splice(index, 1, newVal)
        } else {
          remove(index)
          sets.splice(index, 1)
        }
      })
    )
  }

  function onObjectSetAddNew() {
    append({ term: '', title: '' })
    setState(
      produce((draft) => {
        draft.objectSets.push({ term: '' as OBJECT_SET_TYPE, title: '' })
      })
    )
  }

  // function onObjectSetUpdate({ index, newVal }: OnUpdateType) {
  //   setValue(`objectSets.${index}`, newVal)
  // }
  //
  // function onObjectSetAddNew() {
  //   append({ term: '', title: '' })
  // }

  function onObjectSetsClick() {
    setState(
      produce((draft) => {
        draft.objectSetsExpanded = !draft.objectSetsExpanded
      })
    )
  }

  // Open or close a controlled Select component
  function handleSelectOpen(index: string, open: boolean) {
    const newState = { ...selectOpenStates }
    newState[index] = open
    setSelectOpenStates(newState)
  }

  const onInputChange = (e, field, override = false) => {
    const value = override ? override : e.target.value
    setValue(field.name, value)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <SC.StyledDialog
      open={show}
      onClose={onDialogClose}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent dividers>
          {config.showNoProjectsAlert && (
            <Alert
              sx={{ mb: 3 }}
              title="Start by creating a project"
              subtitle="All workflows, whether they are programs, courses, or activities, exist within projects. You must start by creating a project before proceeding to create any type of workflow."
            />
          )}
          <StyledBox>
            <FormControl fullWidth error={!!errors.title}>
              <TextField
                label="Title"
                placeholder="New Project Title"
                variant="standard"
                {...register('title', {
                  required: 'Title is required',
                  maxLength: 200
                })}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            </FormControl>

            <FormControl fullWidth error={!!errors.description}>
              <TextField
                label="Description"
                variant="standard"
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </FormControl>

            <FormControl fullWidth error={!!errors.disciplines}>
              <InputLabel id="create-project-discipline">Discipline</InputLabel>
              <Controller
                name="disciplines"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="create-project-discipline"
                    variant={'outlined'}
                    open={selectOpenStates['disciplines'] ?? false}
                    onChange={(e) => {
                      onInputChange(e, field)
                      handleSelectOpen('disciplines', false)
                    }}
                    onOpen={() => handleSelectOpen('disciplines', true)}
                    onClose={() => handleSelectOpen('disciplines', false)}
                    multiple
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip
                            key={value}
                            label={
                              config.formFields[2].options.find(
                                (option) => option.value === value
                              ).label
                            }
                            clickable
                            deleteIcon={
                              <CancelIcon
                                onMouseDown={(event) => event.stopPropagation()}
                              />
                            }
                            onDelete={() => {
                              const newValues = (
                                getValues('disciplines') as string[]
                              ).filter((v) => v !== value)
                              setValue('disciplines', newValues)
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {config.formFields[2].options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.disciplines && (
                <FormHelperText>{errors.disciplines.message}</FormHelperText>
              )}
            </FormControl>
            <ObjectSets
              expanded={state.objectSetsExpanded}
              toggleExpanded={onObjectSetsClick}
              objectSets={state.objectSets}
              onUpdate={onObjectSetUpdate}
              onAddNew={onObjectSetAddNew}
            />
          </StyledBox>
        </DialogContent>
        <DialogActions>
          <Button onClick={onDialogClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Create Project
          </Button>
        </DialogActions>
      </form>
    </SC.StyledDialog>
  )
}

export default ProjectEditDialog
