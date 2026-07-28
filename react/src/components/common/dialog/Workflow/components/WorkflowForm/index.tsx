import { WorkflowTypeIn } from '@cf/api/gen'
import { capitalize } from '@cf/utility/Utility.class'
import { StyledBox } from '@cfComponents/dialog/styles'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import { RefObject, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export const workflowSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
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
  formRef
}: {
  submitHandler: (data: WorkflowFormType) => void
  closeCallback: () => void
  label: string
  defaultValues?: WorkflowFormType
  workflowType: WorkflowTypeIn
  setIsFormReady: (isReady: boolean) => void
  formRef: RefObject<HTMLFormElement>
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
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

        <TextField
          {...register('description')}
          multiline
          maxRows={3}
          name="description"
          variant="standard"
          label={`${capitalize(workflowType)} description`}
          error={!!errors.description}
          helperText={errors.description?.message}
          fullWidth
        />
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
