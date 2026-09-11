import type { WorkspaceEditLockOut } from '@cf/api/gen/types.gen'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type WorkspaceEditLockTakeoverProps = {
  lock: WorkspaceEditLockOut | null
  takeoverPending: boolean
  onTakeover: () => Promise<void>
}

export const WorkspaceEditLockTakeover = ({
  lock,
  takeoverPending,
  onTakeover
}: WorkspaceEditLockTakeoverProps) => {
  const { t } = useTranslation('common')
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!lock?.holder) {
    return null
  }

  const closeDialog = () => {
    if (!takeoverPending) {
      setDialogOpen(false)
    }
  }

  const confirmTakeover = async () => {
    await onTakeover()
    setDialogOpen(false)
  }

  return (
    <>
      <Button
        variant="contained"
        size="small"
        startIcon={<LockRoundedIcon />}
        disabled={takeoverPending || !lock.version}
        onClick={() => setDialogOpen(true)}
        data-testid="workspace-edit-lock-takeover"
      >
        {t('editLock.takeoverAction')}
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        data-testid="workspace-edit-lock-takeover-dialog"
      >
        <DialogTitle>{t('editLock.takeoverTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText data-testid="workspace-edit-lock-takeover-dialog-message">
            {t('editLock.takeoverMessage', {
              displayName: lock.holder.displayName
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            disabled={takeoverPending}
            onClick={closeDialog}
            data-testid="workspace-edit-lock-takeover-cancel"
          >
            {t('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={takeoverPending}
            onClick={() => void confirmTakeover()}
            data-testid="workspace-edit-lock-takeover-confirm"
          >
            {t('editLock.takeoverAction')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export const WorkspaceEditLockLostAlert = ({
  lock,
  visible
}: {
  lock: WorkspaceEditLockOut | null
  visible: boolean
}) => {
  const { t } = useTranslation('common')

  if (!visible || !lock?.holder) {
    return null
  }

  return (
    <Alert severity="warning" data-testid="workspace-edit-lock-lost-alert">
      {t('editLock.takenOver', { displayName: lock.holder.displayName })}
    </Alert>
  )
}
