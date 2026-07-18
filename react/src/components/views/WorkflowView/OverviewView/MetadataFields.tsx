import type {
  WorkflowOverviewMetadataIn,
  WorkflowOverviewMetadataOut
} from '@cf/api/gen/types.gen'
import { WorkflowType } from '@cf/api/gen/types.gen'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ChangeEvent, useEffect, useState } from 'react'

type MetadataKey = keyof WorkflowOverviewMetadataIn

type Props = {
  workflowType: WorkflowType
  metadata: WorkflowOverviewMetadataOut
  canEdit: boolean
  isSaving: boolean
  onSave: (updates: WorkflowOverviewMetadataIn) => Promise<void>
}

const numericValue = (value: string): number | null =>
  value.trim() === '' ? null : Number(value)

const fieldValue = (value: number | null | undefined): string | number =>
  value ?? ''

const MetadataFields = ({
  workflowType,
  metadata,
  canEdit,
  isSaving,
  onSave
}: Props) => {
  const [values, setValues] = useState(metadata)

  useEffect(() => setValues(metadata), [metadata])

  const setValue = <K extends keyof WorkflowOverviewMetadataOut>(
    key: K,
    value: WorkflowOverviewMetadataOut[K]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const saveField = (key: MetadataKey) => {
    const value = values[key]
    void onSave({ [key]: value ?? null })
  }

  const toggle =
    (key: MetadataKey) =>
    (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setValue(key, checked)
      void onSave({ [key]: checked })
    }

  const numericField = (
    label: string,
    key: MetadataKey,
    disabled = false,
    integer = false
  ) => (
    <TextField
      label={_t(label)}
      type="number"
      size="small"
      fullWidth
      value={fieldValue(values[key] as number | null | undefined)}
      disabled={!canEdit || disabled || isSaving}
      inputProps={{ min: 0, step: integer ? 1 : 'any' }}
      onChange={(event) => setValue(key, numericValue(event.target.value))}
      onBlur={() => saveField(key)}
    />
  )

  const isCourseOrProgram =
    workflowType === WorkflowType.COURSE ||
    workflowType === WorkflowType.PROGRAM
  const isProgram = workflowType === WorkflowType.PROGRAM
  const timeAutomatic = Boolean(values.calculateTimeAutomatically)
  const ponderationAutomatic = Boolean(values.calculatePonderationAutomatically)
  const creditsAutomatic = Boolean(values.calculateCreditsAutomatically)
  const classificationAutomatic = Boolean(
    values.calculateClassificationAutomatically
  )
  const ponderationTotal =
    (values.theoryTime ?? 0) +
    (values.practicalTime ?? 0) +
    (values.individualTime ?? 0)
  const classificationTotal =
    (values.generalTime ?? 0) + (values.specificTime ?? 0)
  const hasPonderationMismatch =
    isCourseOrProgram && ponderationTotal !== (values.time ?? 0)
  const hasClassificationMismatch =
    isProgram && classificationTotal !== (values.time ?? 0)

  return (
    <Stack spacing={3} data-test-id="workflow-metadata-section">
      {isCourseOrProgram && (
        <TextField
          label={_t('Code')}
          size="small"
          value={values.code ?? ''}
          disabled={!canEdit || isSaving}
          onChange={(event) => setValue('code', event.target.value)}
          onBlur={() => saveField('code')}
        />
      )}

      <Stack spacing={2}>
        <Typography component="h3" variant="subtitle1" fontWeight={600}>
          {_t('Time')}
        </Typography>
        <FormControlLabel
          label={_t('Calculate time automatically')}
          control={
            <Switch
              checked={timeAutomatic}
              disabled={!canEdit || isSaving}
              onChange={toggle('calculateTimeAutomatically')}
            />
          }
        />
        {numericField('Time', 'time', timeAutomatic)}
      </Stack>

      {isCourseOrProgram && (
        <Stack spacing={2}>
          <Typography component="h3" variant="subtitle1" fontWeight={600}>
            {_t('Ponderation')}
          </Typography>
          {isProgram && (
            <FormControlLabel
              label={_t('Calculate ponderation automatically')}
              control={
                <Switch
                  checked={ponderationAutomatic}
                  disabled={!canEdit || isSaving}
                  onChange={toggle('calculatePonderationAutomatically')}
                />
              }
            />
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              {numericField('Theory', 'theoryTime', ponderationAutomatic)}
            </Grid>
            <Grid item xs={12} md={4}>
              {numericField('Practical', 'practicalTime', ponderationAutomatic)}
            </Grid>
            <Grid item xs={12} md={4}>
              {numericField(
                'Individual',
                'individualTime',
                ponderationAutomatic
              )}
            </Grid>
          </Grid>
          {hasPonderationMismatch && (
            <Alert
              severity="warning"
              data-test-id="workflow-ponderation-warning"
            >
              {_t(
                `Total of ponderation hours does not match ${workflowType} time.`
              )}
            </Alert>
          )}
        </Stack>
      )}

      {isCourseOrProgram && (
        <Stack spacing={2}>
          <Typography component="h3" variant="subtitle1" fontWeight={600}>
            {_t('Credits')}
          </Typography>
          {isProgram && (
            <FormControlLabel
              label={_t('Calculate credits automatically')}
              control={
                <Switch
                  checked={creditsAutomatic}
                  disabled={!canEdit || isSaving}
                  onChange={toggle('calculateCreditsAutomatically')}
                />
              }
            />
          )}
          {numericField('Credits', 'credits', creditsAutomatic, true)}
        </Stack>
      )}

      {isProgram && (
        <Stack spacing={2}>
          <Typography component="h3" variant="subtitle1" fontWeight={600}>
            {_t('Classification')}
          </Typography>
          <FormControlLabel
            label={_t('Calculate classification automatically')}
            control={
              <Switch
                checked={classificationAutomatic}
                disabled={!canEdit || isSaving}
                onChange={toggle('calculateClassificationAutomatically')}
              />
            }
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {numericField(
                'General time',
                'generalTime',
                classificationAutomatic
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {numericField(
                'Specific time',
                'specificTime',
                classificationAutomatic
              )}
            </Grid>
          </Grid>
          {hasClassificationMismatch && (
            <Alert
              severity="warning"
              data-test-id="workflow-classification-warning"
            >
              {_t('Total of classification hours does not match program time')}
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default MetadataFields
