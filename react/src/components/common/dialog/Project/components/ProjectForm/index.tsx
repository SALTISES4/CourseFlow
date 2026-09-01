import { useReferenceData } from '@cf/hooks/useReferenceData'
import { _t } from '@cf/utility/Utility.class'
import { StyledBox } from '@cfComponents/dialog/styles'
import Alert from '@cfComponents/UIPrimitives/Alert'
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
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const projectSchema = z.object({
  title: z
    .string()
    .min(1, { message: _t('Project title cannot be empty') })
    .max(200, {
      message: _t('Project title cannot be longer than 200 characters')
    }),
  description: z.string().nullish(),
  disciplines: z.array(z.string())
})

export type ProjectFormValues = z.infer<typeof projectSchema>

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
  const { data: referenceData } = useReferenceData()
  const disciplineOptions = referenceData?.disciplines ?? []
  const [showDisciplines, setShowDisciplines] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isValid },
    reset,
    trigger,
    clearErrors
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
    mode: 'onChange'
  })

  useEffect(() => {
    if (isDirty) {
      void trigger('title')
      return
    }

    clearErrors('title')
  }, [clearErrors, isDirty, trigger])

  function onDialogClose() {
    reset()
    closeCallback()
  }

  // Open or close a controlled Select component
  function setDisciplineDropdown(open: boolean) {
    setShowDisciplines(open)
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
                  open={showDisciplines}
                  onOpen={() => setDisciplineDropdown(true)}
                  onClose={() => setDisciplineDropdown(false)}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    setDisciplineDropdown(false)
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
                              (option) => option.code === value
                            )?.label
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
                    <MenuItem key={option.code} value={option.code}>
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
          disabled={!isDirty || !isValid}
        >
          {submitLabel ?? _t('Edit project')}
        </Button>
      </DialogActions>
    </form>
  )
}

export default ProjectForm
