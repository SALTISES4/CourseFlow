import {
  archiveProjectMutation,
  archiveWorkflowMutation,
  getProjectQueryKey,
  getWorkflowQueryKey,
  listProjectsQueryKey,
  listWorkflowsQueryKey
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

const ArchiveDialog = ({
  objectType,
  uuid,
  callback
}: {
  uuid: string
  objectType: WorkspaceType
  callback?: () => void | Promise<unknown>
}) => {
  const { show, onClose } = useDialog(DialogMode.ARCHIVE)
  const { onError, onSuccess } = useGenericMsgHandler()
  const queryClient = useQueryClient()

  const archiveWorkflow = useMutation({
    ...archiveWorkflowMutation(),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: getWorkflowQueryKey({ path: { uuid } }),
        exact: true
      })
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: listWorkflowsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['library-search'] })
      ])
    }
  })
  const archiveProject = useMutation({
    ...archiveProjectMutation(),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: getProjectQueryKey({ path: { uuid } }),
        exact: true
      })
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: listProjectsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['library-search'] })
      ])
    }
  })

  const onSubmit = async () => {
    if (!uuid) {
      return
    }
    try {
      if (objectType === WorkspaceType.WORKFLOW) {
        await archiveWorkflow.mutateAsync({ path: { uuid } })
        onSuccess({ message: strings.workflowArchiveSuccess })
      } else {
        await archiveProject.mutateAsync({ path: { uuid } })
        onSuccess({ message: strings.projectArchiveSuccess })
      }
      onClose()
      await callback?.()
    } catch (error) {
      onError(error)
    }
  }

  const objectLabel =
    objectType === WorkspaceType.WORKFLOW ? 'workflow' : 'project'
  const busy = archiveWorkflow.isPending || archiveProject.isPending

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={`archive-${objectType}-modal`}
    >
      <DialogTitle id={`archive-${objectType}-modal`}>
        Archive {objectLabel}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Once your {objectLabel} is archived, it cannot be opened from the
          workspace. You can restore it from your archived library items.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={busy || !uuid}>
          Archive {objectLabel}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ArchiveDialog
