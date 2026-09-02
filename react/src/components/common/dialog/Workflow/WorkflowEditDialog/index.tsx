import { WorkflowType } from '@cf/api/gen'
import {
  getWorkflowOptions,
  getWorkflowQueryKey,
  listWorkflowsQueryKey,
  updateWorkflowMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import {
  WorkflowFormType,
  createWorkflowSchema
} from '@cf/components/common/dialog/Workflow/components/WorkflowForm'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { workflowTypeLabel } from '@cf/i18n/workflowLabels'
import Utility from '@cf/utility/Utility.class'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
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
import { useTranslation } from 'react-i18next'

const WorkflowEditDialog = () => {
  const { t } = useTranslation('workflow')
  const { t: tCommon } = useTranslation('common')
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
  const localizedWorkflowType = workflowTypeLabel(
    t,
    workflow?.workflowType,
    true
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<WorkflowFormType>({
    resolver: zodResolver(createWorkflowSchema(t)),
    mode: 'onChange',
    defaultValues: {
      title: workflow?.title ?? '',
      description: workflow?.description ?? ''
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

      onSuccess({
        localizedMessage: t('messages.updated', {
          workflowType: localizedWorkflowType
        })
      })

      onClose()
    },
    onError: (err) =>
      onError({
        localizedMessage: t('messages.updateFailed', {
          workflowType: localizedWorkflowType
        })
      })
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
      onClose={onClose}
      TransitionProps={{ onExited: resetState }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {t('form.editTitle', { workflowType: localizedWorkflowType })}
        </DialogTitle>
        <DialogContent dividers>
          <StyledBox>
            <TextField
              {...register('title')}
              name="title"
              variant="standard"
              required
              label={t('form.title')}
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
              label={t('form.description')}
              error={!!errors.description}
              helperText={errors.description?.message}
              fullWidth
            />
          </StyledBox>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="secondary" onClick={onClose}>
            {tCommon('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || !workflow || !!Object.keys(errors).length}
          >
            {t('form.update', { workflowType: localizedWorkflowType })}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  )
}

export default WorkflowEditDialog
