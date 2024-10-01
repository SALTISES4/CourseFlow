import { _t } from '@cf/utility/utilityFunctions'
import ObjectSets from '@cfComponents/dialog/Project/components/ObjectSets'
import {
  ObjectSetOptions,
  ObjectSetType
} from '@cfComponents/dialog/Project/components/ObjectSets/type'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { StyledBox } from '@cfPages/Styleguide/dialog/styles'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { produce } from 'immer'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

export type OnUpdateType = {
  index: number
  newVal?: ObjectSetType
}

export type StateType = {
  objectSets: ObjectSetType[]
  objectSetsExpanded: boolean
}

export type ProjectFormValues = {
  title: string
  description: string
  disciplines: string[]
  objectSets: ObjectSetType[]
}

const initialState = {
  objectSets: [],
  objectSetsExpanded: false
}
const projectSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(200),
  description: z.string().optional(),
  disciplines: z
    .array(z.string())
    .min(1, { message: 'At least one discipline is required' }),
  objectSets: z.array(
    z.object({
      id: z.string().optional(),
      term: z.string(),
      title: z.string()
    })
  )
})

/**
 *
 * @param showNoProjectsAlert
 * @param formFields
 * @constructor
 */
const ProjectForm = ({
  defaultValues,
  submitHandler,
  closeCallback,
  showNoProjectsAlert,
  label
}: {
  defaultValues: ProjectFormValues
  submitHandler: (data: ProjectFormValues) => void
  closeCallback: () => void
  showNoProjectsAlert: boolean
  label: string
}) => {
  /*******************************************************
   * PROPS
   *******************************************************/
  const disciplineOptions = COURSEFLOW_APP.globalContextData.disciplines
  /*******************************************************
   * HOOKS
   *******************************************************/
  const [state, setState] = useState<StateType>(initialState)
  const [selectOpenStates, setSelectOpenStates] = useState({})

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    getValues,
    reset
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues
  })

  /*******************************************************
   * LIFE CYCLE HOOKS
   *******************************************************/
  useEffect(() => {
    setState(
      produce((draft) => {
        draft.objectSets = defaultValues.objectSets
      })
    )
  }, [defaultValues])

  const {
    fields: objectSetsFields,
    append,
    remove,
    update
  } = useFieldArray({
    control,
    name: 'objectSets'
  })

  function onDialogClose() {
    setState(initialState)
    reset()
    closeCallback()
  }

  /**
   * either updating existing one
   * or deleting when no newVal is supplied
   * @param index
   * @param newVal
   */
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
        draft.objectSets.push({ term: '' as ObjectSetOptions, title: '' })
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
    <form onSubmit={handleSubmit(submitHandler)}>
      <DialogTitle>{label}</DialogTitle>
      <DialogContent dividers>
        {showNoProjectsAlert && (
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
                      {(selected as string[]).map((value) => {
                        return (
                          <Chip
                            key={value}
                            label={
                              disciplineOptions.find(
                                (option) => String(option.id) === String(value)
                              )?.title
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
                        )
                      })}
                    </Box>
                  )}
                >
                  {disciplineOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.title}
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
          Edit Project
        </Button>
      </DialogActions>
    </form>
  )
}

export default ProjectForm
