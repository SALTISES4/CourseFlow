import { WorkflowType } from '@cf/api/gen'
import {
  copyWorkflowMutation,
  getWorkflowOptions,
  listWorkflowsQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
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

const workflowTypeLabels: Record<WorkflowType, string> = {
  [WorkflowType.PROGRAM]: 'program',
  [WorkflowType.COURSE]: 'course',
  [WorkflowType.ACTIVITY]: 'activity',
  [WorkflowType.TASK]: 'task'
}

const WorkflowCopyToProjectDialog = () => {
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
  const workflowTypeLabel = workflow
    ? workflowTypeLabels[workflow.workflowType]
    : 'workflow'

  useEffect(() => {
    if (show && workflow) {
      setTitle(`${workflow.title} (copy)`)
    }
  }, [show, workflow])

  const titleError = useMemo(() => {
    if (!title.trim()) {
      return 'Title is required'
    }
    if (title.length > 200) {
      return 'Title cannot be longer than 200 characters'
    }
    return undefined
  }, [title])

  const copyWorkflow = useMutation({
    ...copyWorkflowMutation(),
    onSuccess: async (copiedWorkflow) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listWorkflowsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['library-search'] })
      ])
      enqueueSnackbar(
        _t(`The ${workflowTypeLabel} has been successfully copied`),
        { variant: 'success' }
      )
      onClose()
      navigate(
        generatePath(CFRoutes.WORKFLOW_GRAPH, { uuid: copiedWorkflow.uuid })
      )
    },
    onError: () => {
      enqueueSnackbar(
        _t(
          `We encountered an issue and your ${workflowTypeLabel} was not copied`
        ),
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
          {_t(`Copy ${workflowTypeLabel}`)}
        </DialogTitle>
        <DialogContent dividers>
          {workflowQuery.isError ? (
            <Alert severity="error">{_t('Unable to load workflow')}</Alert>
          ) : workflowQuery.isLoading || !workflow ? (
            <Loader />
          ) : (
            <StyledBox>
              <TextField
                name="title"
                variant="standard"
                required
                label={_t('Title')}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={Boolean(titleError)}
                helperText={titleError ? _t(titleError) : undefined}
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
            {_t('Cancel')}
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
            {_t(`Copy ${workflowTypeLabel}`)}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  )
}

export default WorkflowCopyToProjectDialog
