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
  const disciplineOptions = COURSEFLOW_APP.globalContextData.disciplines
  const [state, setState] = useState({
    disciplines: false
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
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
  function showDisciplines(open: boolean) {
    setState({
      disciplines: open
    })
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
              label={_t('Title')}
              placeholder={_t('Project title')}
              variant="standard"
              required
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.description}>
            <TextField
              label={_t('Description')}
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
                  variant="outlined"
                  open={state.disciplines}
                  onOpen={() => showDisciplines(true)}
                  onClose={() => showDisciplines(false)}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    showDisciplines(false)
                  }}
                  multiple
                  renderValue={(selected) => (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5
                      }}
                    >
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          clickable
                          label={
                            disciplineOptions.find(
                              (option) => String(option.id) === String(value)
                            )?.title
                          }
                          deleteIcon={
                            <CancelIcon
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          }
                          onDelete={() => {
                            field.onChange(
                              field.value.filter((v) => v !== value)
                            )
                          }}
                        />
                      ))}
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
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
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
