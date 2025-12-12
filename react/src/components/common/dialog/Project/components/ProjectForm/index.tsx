import { _t } from '@cf/utility/Utility.class'
import { StyledBox } from '@cfComponents/dialog/styles'
import Alert from '@cfComponents/UIPrimitives/Alert'
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
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

export type ProjectFormValues = {
  title: string
  description: string
  disciplines: string[]
}

const projectSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(200),
  description: z.string().nullish(),
  disciplines: z.array(z.string()).optional()
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
  label,
  submitLabel = ''
}: {
  defaultValues: ProjectFormValues
  submitHandler: (data: ProjectFormValues) => void
  closeCallback: () => void
  showNoProjectsAlert: boolean
  label: string
  submitLabel?: string
}) => {
  /*******************************************************
   * PROPS
   *******************************************************/
  const disciplineOptions = COURSEFLOW_APP.globalContextData.disciplines
  /*******************************************************
   * HOOKS
   *******************************************************/
  const [selectOpenStates, setSelectOpenStates] = useState({})

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    setValue,
    getValues,
    reset
  } = useForm<ProjectFormValues>({
    // resolver: zodResolver(projectSchema),
    defaultValues
  })

  function onDialogClose() {
    reset()
    closeCallback()
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
            persistent
            title={_t('Start by creating a project')}
            subtitle={_t(
              'All workflows, whether they are programs, courses, or activities, exist within projects. You must start by creating a project before proceeding to create any type of workflow.'
            )}
          />
        )}
        <StyledBox>
          <FormControl fullWidth error={!!errors.title}>
            <TextField
              label="Title"
              placeholder="New Project Title"
              variant="standard"
              {...register('title')}
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
            <InputLabel id="create-project-discipline">
              {_t('Discipline')}
            </InputLabel>
            <Controller
              name="disciplines"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label={_t('Discipline')}
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
        </StyledBox>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onDialogClose}>
          {_t('Cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isDirty}
        >
          {submitLabel ?? _t('Edit project')}
        </Button>
      </DialogActions>
    </form>
  )
}

export default ProjectForm
