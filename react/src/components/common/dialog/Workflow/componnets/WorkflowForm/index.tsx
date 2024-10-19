import { StyledBox } from '@cfComponents/dialog/styles'
import {
  WorkflowFormType,
  timeUnits
} from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { RefObject, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export enum FormField {
  TITLE = 'title',
  DESCRIPTION = 'description',
  COURSENUMBER = 'courseNumber',
  PONDERATION = 'ponderation',
  DURATION = 'duration',
  UNITS = 'units'
}

function configFields(workflowType: WorkflowType): FormField[] {
  const allFields = [
    FormField.TITLE,
    FormField.DESCRIPTION,
    FormField.PONDERATION,
    FormField.COURSENUMBER,
    FormField.DURATION,
    FormField.UNITS
  ]

  switch (workflowType) {
    case WorkflowType.ACTIVITY:
      return [
        FormField.TITLE,
        FormField.DESCRIPTION,
        FormField.DURATION,
        FormField.UNITS
      ]
    case WorkflowType.PROGRAM:
      return [
        FormField.TITLE,
        FormField.DESCRIPTION,
        FormField.DURATION,
        FormField.UNITS
      ]
    case WorkflowType.COURSE:
    default:
      return allFields
  }
}

const workflowSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().nullish(),
  courseNumber: z.string().nullish(),
  duration: z.string().nullish(),
  units: z.number().nullish(),
  ponderation: z.object({
    theory: z.number(),
    practice: z.number(),
    individual: z.number(),
    generalEdu: z.number(),
    specificEdu: z.number()
  })
})
export type WorkflowFormValues = {
  title: string
  description?: string
  duration?: string
  courseNumber?: string
  units?: number
  ponderation?: {
    theory: number
    practice: number
    individual: number
    generalEdu: number
    specificEdu: number
  }
}

const emptyDefaultValues = {
  title: '',
  description: '',
  duration: '',
  courseNumber: '',
  units: 0,
  ponderation: {
    theory: 0,
    practice: 0,
    individual: 0,
    generalEdu: 0,
    specificEdu: 0
  }
}

const WorkflowForm = ({
  defaultValues = emptyDefaultValues,
  submitHandler,
  closeCallback,
  label,
  workflowType,
  setIsFormReady,
  formRef
}: {
  submitHandler: (data: WorkflowFormValues) => void
  closeCallback: () => void
  label: string
  defaultValues?: WorkflowFormValues
  workflowType?: WorkflowType
  setIsFormReady: (isReady: boolean) => void
  formRef: RefObject<HTMLFormElement>
}) => {
  const config = configFields(workflowType)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isDirty },
    formState
  } = useForm<WorkflowFormType>({
    resolver: zodResolver(workflowSchema),
    defaultValues
  })

  function onDialogClose() {
    reset()
    closeCallback()
  }

  useEffect(() => {
    if (isDirty !== undefined) {
      setIsFormReady(isDirty)
    }
  }, [isDirty])

  return (
    <form ref={formRef} onSubmit={handleSubmit(submitHandler)}>
      <StyledBox>
        {config.includes(FormField.TITLE) && (
          <TextField
            {...register('title')}
            name="title"
            placeholder={'Title'}
            variant="standard"
            label={`${workflowType} title`}
            error={!!errors.title}
            fullWidth
            helperText={errors.title?.message}
          />
        )}

        {config.includes(FormField.DESCRIPTION) && (
          <TextField
            {...register('description')}
            multiline
            maxRows={3}
            name="description"
            variant="standard"
            label={`${workflowType} description`}
            error={!!errors.description}
            helperText={errors.description?.message}
            fullWidth
          />
        )}

        {config.includes(FormField.COURSENUMBER) && (
          <TextField
            {...register('courseNumber')}
            multiline
            maxRows={3}
            name="courseNumber"
            variant="standard"
            label="Course number"
            helperText={errors.courseNumber?.message}
            error={!!errors.courseNumber}
            fullWidth
          />
        )}

        <Stack direction="row" spacing={2}>
          {config.includes(FormField.DURATION) && (
            <TextField
              {...register('duration')}
              fullWidth
              name="duration"
              variant="standard"
              label="Duration"
              error={!!errors.duration}
              helperText={errors.duration?.message}
            />
          )}

          {config.includes(FormField.UNITS) && (
            <FormControl variant="standard" fullWidth>
              <InputLabel>Unit type</InputLabel>
              <Select {...register('units')} label="Unit type" defaultValue={0}>
                {timeUnits.map((unit, idx) => (
                  <MenuItem key={idx} value={idx}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>

        {config.includes(FormField.PONDERATION) && (
          <>
            <Typography sx={{ mt: 1, mb: 1 }}>Ponderation</Typography>
            <Divider />
            <Stack direction="row" spacing={2}>
              <TextField
                {...register('ponderation.theory', { valueAsNumber: true })}
                fullWidth
                name="ponderation.theory"
                variant="standard"
                label="Theory (hrs)"
                type="number"
                helperText={errors.ponderation?.theory?.message}
              />
              <TextField
                {...register('ponderation.practice', {
                  valueAsNumber: true
                })}
                fullWidth
                name="ponderation.practice"
                variant="standard"
                label="Practice (hrs)"
                type="number"
                helperText={errors.ponderation?.practice?.message}
              />
              <TextField
                {...register('ponderation.individual', {
                  valueAsNumber: true
                })}
                fullWidth
                name="individual"
                variant="standard"
                label="Individual work (hrs)"
                type="number"
                helperText={errors.ponderation?.individual?.message}
              />
              <TextField
                {...register('ponderation.generalEdu', {
                  valueAsNumber: true
                })}
                fullWidth
                name="generalEdu"
                variant="standard"
                label="General education (hrs)"
                type="number"
              />
              <TextField
                {...register('ponderation.specificEdu', {
                  valueAsNumber: true
                })}
                fullWidth
                name="specificEdu"
                variant="standard"
                label="Specific education (hrs)"
                type="number"
              />
            </Stack>
          </>
        )}
      </StyledBox>

      {/*
        If we pass in a formref, it means we're submitting this from the parent
        and therefore we don't want the inline submit/cancel button to show
        */}
      {!formRef && (
        <DialogActions>
          <Button variant="contained" color="secondary" onClick={onDialogClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!isDirty}>
            {label}
          </Button>
        </DialogActions>
      )}
    </form>
  )
}

export default WorkflowForm
