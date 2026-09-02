import {
  selectAuthStatus,
  selectIsBootstrapping
} from '@cf/features/auth/state/auth.slice'
import Login from '@cfPages/SignIn/Login'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

/**
 * login: loading gate + redirect authenticated users to home shell.
 * */
export default function LoginPage() {
  const { t } = useTranslation('common')
  const bootstrapping = useSelector(selectIsBootstrapping)
  const status = useSelector(selectAuthStatus)

  if (bootstrapping) {
    return <div style={{ padding: 24 }}>{t('loading')}</div>
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <Login />
}
