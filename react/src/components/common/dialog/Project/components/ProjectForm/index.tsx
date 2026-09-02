import { useReferenceData } from '@cf/hooks/useReferenceData'
import { useReferenceLabels } from '@cf/i18n/referenceLabels'
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
import type { TFunction } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

const createProjectSchema = (t: TFunction<'project'>) =>
  z.object({
    title: z
      .string()
      .min(1, { message: t('form.titleRequired') })
      .max(200, {
        message: t('form.titleMax', { count: 200 })
      }),
    description: z.string().nullish(),
    disciplines: z.array(z.string())
  })

export type ProjectFormValues = z.infer<ReturnType<typeof createProjectSchema>>

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
  const { t } = useTranslation('project')
  const { t: tCommon } = useTranslation('common')
  const projectSchema = useMemo(() => createProjectSchema(t), [t])
  const { data: referenceData } = useReferenceData()
  const { disciplineLabel, collator } = useReferenceLabels()
  const disciplineOptions = useMemo(
    () =>
      (referenceData?.disciplines ?? [])
        .map((option) => ({
          code: option.code,
          label: disciplineLabel(option.code)
        }))
        .sort((a, b) => collator.compare(a.label, b.label)),
    [collator, disciplineLabel, referenceData]
  )
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
            title={t('form.firstProjectTitle')}
            subtitle={t('form.firstProjectHelp')}
          />
        )}
        <StyledBox>
          <FormControl fullWidth error={!!errors.title}>
            <TextField
              label={t('form.title')}
              placeholder={t('form.titlePlaceholder')}
              variant="standard"
              required
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.description}>
            <TextField
              label={t('form.description')}
              variant="standard"
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.disciplines}>
            <InputLabel id="create-project-discipline">
              {t('form.discipline')}
            </InputLabel>
            <Controller
              name="disciplines"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label={t('form.discipline')}
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
          {tCommon('actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isDirty || !isValid}
        >
          {submitLabel || t('actions.edit')}
        </Button>
      </DialogActions>
    </form>
  )
}

export default ProjectForm
