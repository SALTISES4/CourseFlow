import {
  LibraryContentTypeOut,
  type PermissionContextOut,
  ProjectPermission,
  WorkflowPermission
} from '@cf/api/gen'
import {
  deleteProjectMutation,
  deleteWorkflowPermanentlyMutation,
  restoreProjectMutation,
  restoreWorkflowMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import { hasPermission } from '@cf/context/workspacePermissionsContext'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MouseEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Confirmation = 'delete' | 'restore-parent' | null

type Props = {
  uuid: string
  type: LibraryContentTypeOut
  permissions: PermissionContextOut
  projectUuid?: string | null
  projectIsArchived?: boolean | null
}

const LibraryLifecycleActions = ({
  uuid,
  type,
  permissions,
  projectUuid,
  projectIsArchived
}: Props) => {
  const { t } = useTranslation('common')
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const queryClient = useQueryClient()
  const { onError, onSuccess } = useGenericMsgHandler()
  const restoreProject = useMutation({ ...restoreProjectMutation() })
  const restoreWorkflow = useMutation({ ...restoreWorkflowMutation() })
  const deleteProject = useMutation({ ...deleteProjectMutation() })
  const deleteWorkflow = useMutation({
    ...deleteWorkflowPermanentlyMutation()
  })

  const isProject = type === LibraryContentTypeOut.PROJECT
  const canRestore = isProject
    ? hasPermission(permissions, ProjectPermission.RESTORE_PROJECT)
    : hasPermission(permissions, WorkflowPermission.RESTORE)
  const canDelete = isProject
    ? hasPermission(permissions, ProjectPermission.DELETE_PROJECT)
    : hasPermission(permissions, WorkflowPermission.DELETE_PERMANENTLY)
  const busy =
    restoreProject.isPending ||
    restoreWorkflow.isPending ||
    deleteProject.isPending ||
    deleteWorkflow.isPending

  if (!canRestore && !canDelete) {
    return null
  }

  const stopCardClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const refreshLibrary = () =>
    queryClient.invalidateQueries({ queryKey: ['library-search'] })

  const restore = async (event: MouseEvent<HTMLButtonElement>) => {
    stopCardClick(event)
    if (!canRestore || busy) {
      return
    }
    if (!isProject && projectIsArchived) {
      setConfirmation('restore-parent')
      return
    }
    try {
      if (isProject) {
        await restoreProject.mutateAsync({ path: { uuid } })
      } else {
        await restoreWorkflow.mutateAsync({ path: { uuid } })
      }
      await refreshLibrary()
      onSuccess({
        localizedMessage: t('lifecycle.restored', {
          object: t(
            isProject
              ? 'lifecycle.object.project'
              : 'lifecycle.object.workflow'
          )
        })
      })
    } catch (error) {
      onError(error)
    }
  }

  const confirm = async () => {
    try {
      if (confirmation === 'restore-parent') {
        if (!projectUuid) {
          throw new Error('The parent project is unavailable')
        }
        await restoreProject.mutateAsync({ path: { uuid: projectUuid } })
        onSuccess({ localizedMessage: t('lifecycle.parentRestored') })
      } else if (confirmation === 'delete') {
        if (isProject) {
          await deleteProject.mutateAsync({ path: { uuid } })
        } else {
          await deleteWorkflow.mutateAsync({ path: { uuid } })
        }
        onSuccess({
          localizedMessage: t('lifecycle.permanentlyDeleted', {
            object: t(
              isProject
                ? 'lifecycle.object.project'
                : 'lifecycle.object.workflow'
            )
          })
        })
      }
      setConfirmation(null)
      await refreshLibrary()
    } catch (error) {
      onError(error)
    }
  }

  const closeConfirmation = () => {
    if (!busy) {
      setConfirmation(null)
    }
  }

  const restoreParent = confirmation === 'restore-parent'
  const localizedObjectLabel = t(
    isProject ? 'lifecycle.object.project' : 'lifecycle.object.workflow'
  )

  return (
    <>
      <Stack
        className="library-lifecycle-actions"
        direction="row"
        spacing={1}
        onClick={stopCardClick}
      >
        {canRestore && (
          <Button
            size="small"
            variant="outlined"
            onClick={restore}
            disabled={busy}
            data-test-id={
              isProject ? 'project-card-restore' : 'workflow-card-restore'
            }
          >
            {t(isProject ? 'lifecycle.restoreProject' : 'lifecycle.restore')}
          </Button>
        )}
        {canDelete && (
          <Button
            size="small"
            color="error"
            onClick={(event) => {
              stopCardClick(event)
              setConfirmation('delete')
            }}
            disabled={busy}
            data-test-id={
              isProject
                ? 'project-card-delete-permanently'
                : 'workflow-card-delete-permanently'
            }
          >
            {t('lifecycle.deletePermanently')}
          </Button>
        )}
      </Stack>

      <StyledDialog
        open={confirmation !== null}
        onClose={closeConfirmation}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {restoreParent
            ? t('lifecycle.restoreParentTitle')
            : t('lifecycle.permanentlyDeleteTitle', {
                object: localizedObjectLabel
              })}
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            {restoreParent
              ? t('lifecycle.restoreParentWarning')
              : t('lifecycle.permanentlyDeleteWarning', {
                  object: localizedObjectLabel
                })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmation} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            color={restoreParent ? 'primary' : 'error'}
            onClick={confirm}
            disabled={busy}
          >
            {restoreParent
              ? t('lifecycle.restoreProject')
              : t('lifecycle.deleteObject', { object: localizedObjectLabel })}
          </Button>
        </DialogActions>
      </StyledDialog>
    </>
  )
}

export default LibraryLifecycleActions
