import { WorkflowTypeIn } from '@cf/api/gen'
import { workflowTypeLabel } from '@cf/i18n/workflowLabels'
import { StyledBox } from '@cfComponents/dialog/styles'
import RichTextDescription from '@cfComponents/dialog/Workflow/components/RichTextDescription'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import { RefObject, useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

export const createWorkflowSchema = (t: TFunction<'workflow'>) => z.object({
  title: z
    .string()
    .max(200, { message: t('form.titleMax', { count: 200 }) })
    .refine((value) => value.trim().length > 0, {
      message: t('form.titleRequired')
    }),
  description: z.string().nullish()
})

export type WorkflowFormType = {
  title: string
  description?: string | null
}

const emptyDefaultValues: WorkflowFormType = {
  title: '',
  description: ''
}

const WorkflowForm = ({
  defaultValues = emptyDefaultValues,
  submitHandler,
  closeCallback,
  label,
  workflowType,
  setIsFormReady,
  onValuesChange,
  formRef
}: {
  submitHandler: (data: WorkflowFormType) => void
  closeCallback: () => void
  label: string
  defaultValues?: WorkflowFormType
  workflowType: WorkflowTypeIn
  setIsFormReady: (isReady: boolean) => void
  onValuesChange?: (values: WorkflowFormType) => void
  formRef: RefObject<HTMLFormElement>
}) => {
  const { t } = useTranslation('workflow')
  const { t: tCommon } = useTranslation('common')
  const localizedWorkflowType = workflowTypeLabel(t, workflowType, true)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<WorkflowFormType>({
    resolver: zodResolver(createWorkflowSchema(t)),
    defaultValues,
    mode: 'onChange'
  })
  const values = useWatch({ control })

  function onDialogClose() {
    reset()
    closeCallback()
  }

  useEffect(() => {
    setIsFormReady(isValid)
  }, [isValid, setIsFormReady])

  useEffect(() => {
    onValuesChange?.({
      title: values.title ?? '',
      description: values.description ?? ''
    })
  }, [onValuesChange, values.description, values.title])

  return (
    <form ref={formRef} onSubmit={handleSubmit(submitHandler)}>
      <StyledBox>
        <TextField
          {...register('title')}
          name="title"
          placeholder={t('form.title')}
          variant="standard"
          label={t('form.titleForType', {
            workflowType: localizedWorkflowType
          })}
          error={!!errors.title}
          fullWidth
          helperText={errors.title?.message}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextDescription
              label={t('form.descriptionForType', {
                workflowType: localizedWorkflowType
              })}
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
      </StyledBox>

      {/*
        If we pass in a formref, it means we're submitting this from the parent
        and therefore we don't want the inline submit/cancel button to show
        */}
      {!formRef && (
        <DialogActions>
          <Button variant="contained" color="secondary" onClick={onDialogClose}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={!isValid}>
            {label}
          </Button>
        </DialogActions>
      )}
    </form>
  )
}

export default WorkflowForm
