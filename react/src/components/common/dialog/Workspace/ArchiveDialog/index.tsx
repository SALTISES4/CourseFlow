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
import { StyledDialog } from '@cfComponents/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation(['workspace', 'common'])
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
        onSuccess({
          localizedMessage: t('workspace:lifecycle.archiveSuccess', {
            object: t('workspace:lifecycle.object.workflow')
          })
        })
      } else {
        await archiveProject.mutateAsync({ path: { uuid } })
        onSuccess({
          localizedMessage: t('workspace:lifecycle.archiveSuccess', {
            object: t('workspace:lifecycle.object.project')
          })
        })
      }
      onClose()
      await callback?.()
    } catch (error) {
      onError(error)
    }
  }

  const objectLabel =
    objectType === WorkspaceType.WORKFLOW
      ? t('workspace:lifecycle.object.workflow')
      : t('workspace:lifecycle.object.project')
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
        {t('workspace:lifecycle.archiveTitle', { object: objectLabel })}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {t('workspace:lifecycle.archiveWarning', { object: objectLabel })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {t('common:actions.cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={busy || !uuid}>
          {t('workspace:lifecycle.archiveAction', { object: objectLabel })}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ArchiveDialog
