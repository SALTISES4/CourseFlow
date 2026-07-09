import { WorkflowType } from '@cf/api/gen'
import {
  getWorkflowOptions,
  getWorkflowQueryKey,
  listWorkflowsQueryKey,
  updateWorkflowMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import Utility, { _t } from '@cf/utility/Utility.class'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import { WorkflowFormType } from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

const WorkflowLabels: Record<WorkflowType, string> = {
  [WorkflowType.PROGRAM]: _t('Program'),
  [WorkflowType.ACTIVITY]: _t('Activity'),
  [WorkflowType.COURSE]: _t('Course'),
  [WorkflowType.TASK]: _t('Task')
}

// Define the Zod schema for validation
const workflowSchema = z.object({
  title: z.string().min(1, { message: _t('Title is required') }),
  description: z.string().min(1, { message: _t('Description is required') })
})

const WorkflowEditDialog = () => {
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''

  const { show, onClose } = useDialog(DialogMode.WORKFLOW_EDIT)
  const { onError, onSuccess } = useGenericMsgHandler()
  const queryClient = useQueryClient()

  const { data: workflowDetail } = useQuery({
    ...getWorkflowOptions({ path: { uuid: workflowUuid } }),
    enabled: Boolean(workflowUuid) && show
  })
  const workflow = workflowDetail?.item
  const workflowTypeLabel =
    (workflow?.workflowType &&
      WorkflowLabels[workflow.workflowType as WorkflowType]) ||
    _t('Workflow')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<WorkflowFormType>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      title: '',
      description: ''
    }
  })

  useEffect(() => {
    if (!workflow) {
      return
    }
    reset({
      title: workflow.title ?? '',
      description: workflow.description ?? ''
    })
  }, [workflow, reset])

  const updateWorkflow = useMutation({
    ...updateWorkflowMutation(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getWorkflowQueryKey({ path: { uuid: variables.path.uuid } })
      })
      queryClient.invalidateQueries({
        queryKey: listWorkflowsQueryKey()
      })
      onSuccess({ message: 'Success' })
      onClose()
    },
    onError: (err) => onError(err)
  })

  const onSubmit = useCallback(
    (data: WorkflowFormType) => {
      updateWorkflow.mutate({
        path: { uuid: workflowUuid },
        body: Utility.replaceEmptyStringsWithNull(data)
      })
    },
    [updateWorkflow, workflowUuid]
  )

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
      TransitionProps={{ onExited: resetState }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {_t(`Edit ${workflowTypeLabel.toLowerCase()}`)}
        </DialogTitle>
        <DialogContent dividers>
          <StyledBox>
            <TextField
              {...register('title')}
              name="title"
              variant="standard"
              required
              label={_t(`Title`)}
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
              label={_t(`${workflowTypeLabel} description`)}
              error={!!errors.description}
              helperText={errors.description?.message}
              fullWidth
            />
          </StyledBox>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="secondary" onClick={onClose}>
            {_t('Cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || !workflow}
          >
            {_t(`Update ${workflowTypeLabel.toLowerCase()}`)}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  )
}

export default WorkflowEditDialog
