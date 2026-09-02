import Base from '@cf/base'
import {
  selectAuthStatus,
  selectIsBootstrapping
} from '@cf/features/auth/state/auth.slice'
import WorkflowPage from '@cfPages/Workflow'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

export function WorkflowRoute() {
  const { t } = useTranslation('common')
  const bootstrapping = useSelector(selectIsBootstrapping)
  const status = useSelector(selectAuthStatus)

  if (bootstrapping) {
    return <div style={{ padding: 24 }}>{t('loading')}</div>
  }

  if (status === 'authenticated') {
    return (
      <Base>
        <WorkflowPage />
      </Base>
    )
  }

  return (
    <div data-test-id="public-workflow-shell">
      <WorkflowPage publicView />
    </div>
  )
}
