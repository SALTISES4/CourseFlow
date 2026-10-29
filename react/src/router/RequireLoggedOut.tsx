import {
  selectAuthStatus,
  selectIsBootstrapping
} from '@cf/features/auth/state/auth.slice'
import { CFRoutes } from '@cf/router/cfRoutes'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

export function RequireLoggedOut() {
  const { t } = useTranslation('common')
  const bootstrapping = useSelector(selectIsBootstrapping)
  const status = useSelector(selectAuthStatus)

  if (bootstrapping) {
    return <div style={{ padding: 24 }}>{t('loading')}</div>
  }

  if (status === 'authenticated') {
    return <Navigate to={CFRoutes.HOME} replace />
  }

  return <Outlet />
}
