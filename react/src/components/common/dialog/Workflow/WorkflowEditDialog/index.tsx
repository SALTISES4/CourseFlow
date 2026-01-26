import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import Utility, { _t } from '@cf/utility/Utility.class'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import { FormField } from '@cfComponents/dialog/Workflow/componnets/WorkflowForm'
import {
  WorkflowFormType,
  timeUnits
} from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { RootState } from '@cfRedux/store'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useUpdateWorkflowMutation } from '@XMLHTTP/API/workflowObjects/workflow.rtk'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

function configFields(
  workflow: RootState['workspace']['workflow']
): FormField[] {
  const allFields = [
    FormField.TITLE,
    FormField.DESCRIPTION,
    FormField.PONDERATION,
    FormField.COURSENUMBER,
    FormField.DURATION,
    FormField.UNITS
  ]

  switch (workflow.type) {
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
// Define the Zod schema for validation
const workflowSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
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

const WorkflowEditDialog = () => {
  const { id } = useParams()
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  const config = configFields(workflow)
  const { show, onClose } = useDialog(DialogMode.WORKFLOW_EDIT)
  const { onError, onSuccess } = useGenericMsgHandler()

  let typeLabel = ''
  switch (workflow.type) {
    case WorkflowType.PROGRAM:
      typeLabel = 'Program'
      break
    case WorkflowType.ACTIVITY:
      typeLabel = 'Activity'
      break
    case WorkflowType.COURSE:
      typeLabel = 'Course'
      break
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<WorkflowFormType>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      title: workflow.title,
      description: workflow.description,
      duration: workflow.timeRequired,
      courseNumber: workflow.code,
      ponderation: {
        theory: workflow.ponderationTheory,
        practice: workflow.ponderationPractical,
        individual: workflow.ponderationIndividual,
        generalEdu: workflow.ponderationIndividual,
        specificEdu: workflow.ponderationTheory
      },
      units: workflow.timeUnits ?? 0
    }
  })

  const [mutate] = useUpdateWorkflowMutation()

  const onSubmit = async (data: WorkflowFormType) => {
    // still not sure if this should be handled by django or not
    const payload = Utility.replaceEmptyStringsWithNull(data)
    try {
      const resp = await mutate({
        id: Number(id),
        payload
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  const resetState = () => {
    reset()
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <StyledDialog
      open={show}
      fullWidth
      maxWidth="sm"
      onClose={() => {
        onClose()
        resetState()
      }}
      TransitionProps={{
        onExited: resetState
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{_t(`Edit ${typeLabel.toLowerCase()}`)}</DialogTitle>
        <DialogContent dividers>
          <StyledBox>
            {config.includes(FormField.TITLE) && (
              <TextField
                {...register('title')}
                name="title"
                variant="standard"
                label={_t(`${typeLabel} title`)}
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
                label={_t(`${typeLabel} description`)}
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
                label={_t(`${typeLabel} number`)}
                helperText={errors.courseNumber?.message}
                error={!!errors.description}
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
                  label={_t('Duration')}
                  error={!!errors.duration}
                  helperText={errors.duration?.message}
                />
              )}

              {config.includes(FormField.UNITS) && (
                <FormControl variant="standard" fullWidth>
                  <InputLabel>{_t('Unit type')}</InputLabel>
                  <Select
                    {...register('units')}
                    label={_t('Unit type')}
                    defaultValue={workflow.timeUnits ?? '0'}
                  >
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
                <Typography sx={{ mt: 1, mb: 1 }}>
                  {_t('Ponderation')}
                </Typography>
                <Divider />
                <Stack direction="row" spacing={2}>
                  <TextField
                    {...register('ponderation.theory', { valueAsNumber: true })}
                    fullWidth
                    name="ponderation.theory"
                    variant="standard"
                    label={_t('Theory (hrs)')}
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
                    label={_t('Practice (hrs)')}
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
                    label={_t('Individual work (hrs)')}
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
                    label={_t('General education (hrs)')}
                    type="number"
                  />
                  <TextField
                    {...register('ponderation.specificEdu', {
                      valueAsNumber: true
                    })}
                    fullWidth
                    name="specificEdu"
                    variant="standard"
                    label={_t('Specific education (hrs)')}
                    type="number"
                  />
                </Stack>
              </>
            )}
          </StyledBox>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="secondary" onClick={onClose}>
            {_t('Cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={!isDirty}>
            {_t(`Update ${typeLabel.toLowerCase()}`)}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  )
}

export default WorkflowEditDialog
