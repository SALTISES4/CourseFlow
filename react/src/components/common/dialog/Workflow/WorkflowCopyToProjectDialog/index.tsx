import {
  copyWorkflowMutation,
  getWorkflowOptions,
  listWorkflowsQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { workflowTypeLabel } from '@cf/i18n/workflowLabels'
import { CFRoutes } from '@cf/router/appRoutes'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import WorkflowDestinationProjectSearch from '@cfComponents/dialog/Workflow/WorkflowDestinationProjectSearch'
import Loader from '@cfComponents/UIPrimitives/Loader'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const WorkflowCopyToProjectDialog = () => {
  const { t } = useTranslation('workflow')
  const { t: tCommon } = useTranslation('common')
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''
  const { show, onClose } = useDialog(DialogMode.WORKFLOW_COPY_TO_PROJECT)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [projectUuid, setProjectUuid] = useState<string>()

  const workflowQuery = useQuery({
    ...getWorkflowOptions({ path: { uuid: workflowUuid } }),
    enabled: show && Boolean(workflowUuid)
  })
  const workflow = workflowQuery.data?.item
  const localizedWorkflowType = workflowTypeLabel(
    t,
    workflow?.workflowType,
    true
  )

  useEffect(() => {
    if (show && workflow) {
      setTitle(t('form.copyTitle', { title: workflow.title }))
    }
  }, [show, t, workflow])

  const titleError = useMemo(() => {
    if (!title.trim()) {
      return t('form.titleRequired')
    }
    if (title.length > 200) {
      return t('form.titleMax', { count: 200 })
    }
    return undefined
  }, [t, title])

  const copyWorkflow = useMutation({
    ...copyWorkflowMutation(),
    onSuccess: async (copiedWorkflow) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listWorkflowsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['library-search'] })
      ])
      enqueueSnackbar(
        t('messages.copied', { workflowType: localizedWorkflowType }),
        { variant: 'success' }
      )
      onClose()
      navigate(
        generatePath(CFRoutes.WORKFLOW_GRAPH, { uuid: copiedWorkflow.uuid })
      )
    },
    onError: () => {
      enqueueSnackbar(
        t('messages.copyFailed', { workflowType: localizedWorkflowType }),
        { variant: 'error' }
      )
    }
  })

  const onProjectSelect = useCallback((selected?: string) => {
    setProjectUuid(selected)
  }, [])

  const resetState = useCallback(() => {
    setTitle('')
    setProjectUuid(undefined)
    copyWorkflow.reset()
  }, [copyWorkflow])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workflow || !projectUuid || titleError) {
      return
    }

    copyWorkflow.mutate({
      path: { uuid: workflow.uuid },
      body: { projectUuid, title: title.trim() }
    })
  }

  return (
    <StyledDialog
      open={show}
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      TransitionProps={{ onExited: resetState }}
      data-test-id="copy-workflow-dialog"
    >
      <form onSubmit={submit}>
        <DialogTitle data-test-id="copy-workflow-dialog-title">
          {t('copyDialog.title', { workflowType: localizedWorkflowType })}
        </DialogTitle>
        <DialogContent dividers>
          {workflowQuery.isError ? (
            <Alert severity="error">{t('copyDialog.loadFailed')}</Alert>
          ) : workflowQuery.isLoading || !workflow ? (
            <Loader />
          ) : (
            <StyledBox>
              <TextField
                name="title"
                variant="standard"
                required
                label={t('form.title')}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={Boolean(titleError)}
                helperText={titleError}
                inputProps={{
                  maxLength: 201,
                  'data-test-id': 'copy-workflow-title-field'
                }}
                fullWidth
              />
              <WorkflowDestinationProjectSearch
                selected={projectUuid}
                contextProjectUuid={workflow.projectUuid}
                onProjectSelect={onProjectSelect}
                panelTestId="copy-workflow-select-project-panel"
              />
            </StyledBox>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            onClick={onClose}
            data-test-id="copy-workflow-cancel-button"
          >
            {tCommon('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              !workflow ||
              !projectUuid ||
              Boolean(titleError) ||
              copyWorkflow.isPending
            }
            data-test-id="copy-workflow-submit-button"
          >
            {t('copyDialog.submit', { workflowType: localizedWorkflowType })}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  )
}

export default WorkflowCopyToProjectDialog
