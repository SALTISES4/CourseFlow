import {
  listProjectsQueryKey,
  listWorkflowsQueryKey,
  restoreProjectMutation,
  restoreWorkflowMutation
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
import { useMutation, useQueryClient } from '@tanstack/react-query'

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

  const restoreWorkflow = useMutation({
    ...restoreWorkflowMutation(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: listWorkflowsQueryKey() })
  })
  const restoreProject = useMutation({
    ...restoreProjectMutation(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: listProjectsQueryKey() })
  })

  const onSubmit = async () => {
    if (!entityUuid) {
      return
    }
    try {
      if (objectType === WorkspaceType.WORKFLOW) {
        await restoreWorkflow.mutateAsync({ path: { uuid: entityUuid } })
        onSuccess({ message: strings.workflowUnarchiveSuccess })
      } else {
        await restoreProject.mutateAsync({ path: { uuid: entityUuid } })
        onSuccess({ message: strings.projectUnarchiveSuccess })
      }
      onClose()
      await callback?.()
    } catch (error) {
      onError(error)
    }
  }

  const objectLabel =
    objectType === WorkspaceType.WORKFLOW ? 'workflow' : 'project'
  const busy = restoreWorkflow.isPending || restoreProject.isPending

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
          disabled={busy || !entityUuid}
        >
          Restore {objectLabel}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default RestoreDialog
