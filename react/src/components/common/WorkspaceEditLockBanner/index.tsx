import type { WorkspaceEditLockOut } from '@cf/api/gen/types.gen'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { useTranslation } from 'react-i18next'

type WorkspaceEditLockBannerProps = {
  lock: WorkspaceEditLockOut | null
  takeoverPending: boolean
  onTakeover: () => Promise<void>
}

const WorkspaceEditLockBanner = ({
  lock,
  takeoverPending,
  onTakeover
}: WorkspaceEditLockBannerProps) => {
  const { t } = useTranslation('common')

  if (!lock?.holder) {
    return null
  }

  return (
    <Alert
      severity="warning"
      data-testid="workspace-edit-lock-banner"
      action={
        <Button
          color="inherit"
          disabled={takeoverPending || !lock.version}
          onClick={() => void onTakeover()}
          data-testid="workspace-edit-lock-takeover"
        >
          {t('editLock.takeover')}
        </Button>
      }
    >
      <span data-testid="workspace-edit-lock-message">
        {t('editLock.banner', { displayName: lock.holder.displayName })}
      </span>
    </Alert>
  )
}

export default WorkspaceEditLockBanner
