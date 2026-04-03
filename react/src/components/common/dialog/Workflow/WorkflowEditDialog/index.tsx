import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import Utility, { _t } from '@cf/utility/Utility.class'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import { WorkflowFormType } from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { RootState } from '@cfRedux/store'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

const WorkflowLabels: Record<WorkflowType, string> = {
  [WorkflowType.PROGRAM]: _t('Program'),
  [WorkflowType.ACTIVITY]: _t('Activity'),
  [WorkflowType.COURSE]: _t('Course')
}

// Define the Zod schema for validation
const workflowSchema = z.object({
  title: z.string().min(1, { message: _t('Title is required') }),
  description: z.string().min(1, { message: _t('Description is required') })
})

const WorkflowEditDialog = () => {
  const { uuid } = useParams()
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  const { show, onClose } = useDialog(DialogMode.WORKFLOW_EDIT)
  const { onError, onSuccess } = useGenericMsgHandler()

  const workflowTypeLabel = WorkflowLabels[workflow.type]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<WorkflowFormType>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      title: workflow.title,
      description: workflow.description
    }
  })

  // @todo replace
  const [mutate] = useUpdateWorkflowMutation()

  // TODO: still not sure if this should be handled by django or not
  const onSubmit = useCallback(
    (data: WorkflowFormType) => {
      mutate({
        uuid: String(id),
        payload: Utility.replaceEmptyStringsWithNull(data)
      })
        .unwrap()
        .then((resp) => onSuccess(resp))
        .catch((e) => onError(e))
    },
    [id, mutate, onError, onSuccess]
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
          <Button type="submit" variant="contained" disabled={!isDirty}>
            {_t(`Update ${workflowTypeLabel.toLowerCase()}`)}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  )
}

export default WorkflowEditDialog
