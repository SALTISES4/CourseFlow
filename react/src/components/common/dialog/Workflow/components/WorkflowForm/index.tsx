import { WorkflowTypeIn } from '@cf/api/gen'
import { _t, capitalize } from '@cf/utility/Utility.class'
import { StyledBox } from '@cfComponents/dialog/styles'
import RichTextDescription from '@cfComponents/dialog/Workflow/components/RichTextDescription'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import { RefObject, useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

export const workflowSchema = z.object({
  title: z
    .string()
    .max(200, { message: 'Title cannot be longer than 200 characters' })
    .refine((value) => value.trim().length > 0, {
      message: 'Title is required'
    }),
  description: z.string().nullish()
})

export type WorkflowFormType = z.infer<typeof workflowSchema>

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
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<WorkflowFormType>({
    resolver: zodResolver(workflowSchema),
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
          placeholder={'Title'}
          variant="standard"
          label={`${capitalize(workflowType)} title`}
          error={!!errors.title}
          fullWidth
          helperText={errors.title?.message}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextDescription
              label={`${capitalize(workflowType)} description`}
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
            {_t('Cancel')}
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
