import type {
  WorkflowOverviewMetadataIn,
  WorkflowOverviewMetadataOut
} from '@cf/api/gen/types.gen'
import { WorkflowType } from '@cf/api/gen/types.gen'
import DurationTextField from '@cfComponents/DurationTextField'
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { ChangeEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as SC from './styles'

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
  const { t } = useTranslation('workflow')
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
    integer = false,
    fullWidth = false
  ) => (
    <TextField
      label={label}
      type="number"
      size="small"
      fullWidth={fullWidth}
      value={fieldValue(values[key] as number | null | undefined)}
      disabled={!canEdit || disabled || isSaving}
      inputProps={{ min: 0, step: integer ? 1 : 'any' }}
      onChange={(event) => setValue(key, numericValue(event.target.value))}
      onBlur={() => saveField(key)}
    />
  )

  const durationField = (
    label: string,
    key: MetadataKey,
    disabled = false,
    fullWidth = false
  ) => (
    <DurationTextField
      label={label}
      value={values[key] as number | null | undefined}
      disabled={!canEdit || disabled || isSaving}
      fullWidth={fullWidth}
      onValueChange={(value) => setValue(key, value)}
      onValueCommit={(value) => void onSave({ [key]: value })}
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
    <Grid
      container
      direction="row"
      wrap="wrap"
      columnSpacing={2}
      rowSpacing={3}
      data-test-id="workflow-metadata-section"
    >
      <Grid item xs={6}>
        <SC.InfoBlock>
          <SC.InfoBlockTitle>{t('metadata.time')}</SC.InfoBlockTitle>
          <SC.InfoBlockContent>
            <Stack direction="row" spacing={2}>
              {durationField(t('metadata.time'), 'time', timeAutomatic)}
              <FormControlLabel
                label={t('metadata.calculateTime')}
                control={
                  <Switch
                    checked={timeAutomatic}
                    disabled={!canEdit || isSaving}
                    onChange={toggle('calculateTimeAutomatically')}
                  />
                }
              />
            </Stack>
          </SC.InfoBlockContent>
        </SC.InfoBlock>
      </Grid>

      {isCourseOrProgram && (
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{t('metadata.credits')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              <Stack direction="row" spacing={2}>
                {numericField(t('metadata.credits'), 'credits', creditsAutomatic, true)}
                {isProgram && (
                  <FormControlLabel
                    label={t('metadata.calculateCredits')}
                    control={
                      <Switch
                        checked={creditsAutomatic}
                        disabled={!canEdit || isSaving}
                        onChange={toggle('calculateCreditsAutomatically')}
                      />
                    }
                  />
                )}
              </Stack>
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      )}

      {isCourseOrProgram && (
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{t('metadata.ponderation')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {isProgram && (
                <FormControlLabel
                  label={t('metadata.calculatePonderation')}
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
                  {durationField(t('metadata.theory'), 'theoryTime', ponderationAutomatic)}
                </Grid>
                <Grid item xs={12} md={4}>
                  {durationField(
                    t('metadata.practical'),
                    'practicalTime',
                    ponderationAutomatic
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {durationField(
                    t('metadata.individual'),
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
                  {t('metadata.ponderationMismatch', {
                    workflowType
                  })}
                </Alert>
              )}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      )}

      {isProgram && (
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{t('metadata.classification')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              <FormControlLabel
                label={t('metadata.calculateClassification')}
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
                  {durationField(
                    t('metadata.generalTime'),
                    'generalTime',
                    classificationAutomatic,
                    true
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {durationField(
                    t('metadata.specificTime'),
                    'specificTime',
                    classificationAutomatic,
                    true
                  )}
                </Grid>
              </Grid>
              {hasClassificationMismatch && (
                <Alert
                  severity="warning"
                  data-test-id="workflow-classification-warning"
                >
                  {t('metadata.classificationMismatch')}
                </Alert>
              )}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      )}

      {isCourseOrProgram && (
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{t('metadata.code')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              <TextField
                label={t('metadata.code')}
                size="small"
                value={values.code ?? ''}
                disabled={!canEdit || isSaving}
                onChange={(event) => setValue('code', event.target.value)}
                onBlur={() => saveField('code')}
              />
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      )}
    </Grid>
  )
}

export default MetadataFields
