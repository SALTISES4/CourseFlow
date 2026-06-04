import {
  getProjectOptions,
  getProjectQueryKey,
  getWorkflowOptions,
  getWorkflowQueryKey,
  listProjectsQueryKey,
  listWorkflowsQueryKey,
  updateProjectMutation,
  updateWorkflowMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { WorkspaceType } from '@cf/types/enum'
import strings from '@cf/utility/strings'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

const RestoreDialog = ({
  objectType,
  uuid,
  id,
  callback
}: {
  uuid?: string
  id?: string
  objectType: WorkspaceType
  callback?: () => void | Promise<unknown>
}) => {
  const entityUuid = uuid ?? id ?? ''

  const { show, onClose } = useDialog(DialogMode.RESTORE)
  const { onError, onSuccess } = useGenericMsgHandler()
  const queryClient = useQueryClient()

  const { data: workflowDetail } = useQuery({
    ...getWorkflowOptions({ path: { uuid: entityUuid } }),
    enabled:
      Boolean(entityUuid) && !!show && objectType === WorkspaceType.WORKFLOW
  })

  const { data: projectDetail } = useQuery({
    ...getProjectOptions({ path: { uuid: entityUuid } }),
    enabled:
      Boolean(entityUuid) && !!show && objectType === WorkspaceType.PROJECT
  })

  const restoreWorkflow = useMutation({
    ...updateWorkflowMutation(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getWorkflowQueryKey({ path: { uuid: variables.path.uuid } })
      })
      queryClient.invalidateQueries({ queryKey: listWorkflowsQueryKey() })
      onSuccess({ message: strings.workflowUnarchiveSuccess }, () => {
        void Promise.resolve(callback?.())
        onClose()
      })
    },
    onError: (err) => onError(err)
  })

  const restoreProject = useMutation({
    ...updateProjectMutation(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getProjectQueryKey({ path: { uuid: variables.path.uuid } })
      })
      queryClient.invalidateQueries({ queryKey: listProjectsQueryKey() })
      onSuccess({ message: strings.projectUnarchiveSuccess }, () => {
        void Promise.resolve(callback?.())
        onClose()
      })
    },
    onError: (err) => onError(err)
  })

  const onSubmit = useCallback(async () => {
    // TODO(openapi): replace with a dedicated restore/unarchive endpoint (or
    // WorkflowUpdateIn/ProjectUpdateIn fields) when the API supports undo-archive.
    // Today v2 PATCH only updates metadata; we round-trip current title/description
    // so the mutation succeeds and cache invalidation runs.
    if (!entityUuid) {
      return
    }

    try {
      if (objectType === WorkspaceType.WORKFLOW) {
        const item = workflowDetail?.item
        if (!item) {
          throw new Error('Workflow not loaded')
        }
        await restoreWorkflow.mutateAsync({
          path: { uuid: entityUuid },
          body: {
            title: item.title,
            description: item.description
          }
        })
      } else {
        const item = projectDetail?.item
        if (!item) {
          throw new Error('Project not loaded')
        }
        await restoreProject.mutateAsync({
          path: { uuid: entityUuid },
          body: {
            title: item.title,
            description: item.description
          }
        })
      }
    } catch (err) {
      onError(err)
    }
  }, [
    entityUuid,
    objectType,
    workflowDetail?.item,
    projectDetail?.item,
    restoreWorkflow,
    restoreProject,
    onError
  ])

  const busy = restoreWorkflow.isPending || restoreProject.isPending

  const objectLabel =
    objectType === WorkspaceType.WORKFLOW ? 'workflow' : 'project'

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={`restore-${objectType}-modal`}
    >
      <DialogTitle id={`restore-${objectType}-modal`}>
        Restore {objectLabel}
      </DialogTitle>

      <DialogContent dividers>
        <Typography gutterBottom>
          Do you want to restore your {objectLabel}?
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={
            busy ||
            !entityUuid ||
            (objectType === WorkspaceType.WORKFLOW && !workflowDetail?.item) ||
            (objectType === WorkspaceType.PROJECT && !projectDetail?.item)
          }
        >
          Restore {objectLabel}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default RestoreDialog
