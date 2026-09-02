import {
  selectAuthStatus,
  selectIsBootstrapping
} from '@cf/features/auth/state/auth.slice'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

/**
 * Central gate for protected routes: waits for bootstrap, then redirects to /login or renders children.
 */
export function RequireAuth() {
  const { t } = useTranslation('common')
  const bootstrapping = useSelector(selectIsBootstrapping)
  const status = useSelector(selectAuthStatus)
  const location = useLocation()

  if (bootstrapping) {
    return <div style={{ padding: 24 }}>{t('loading')}</div>
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
