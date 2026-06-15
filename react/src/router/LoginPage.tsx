import {
  selectAuthStatus,
  selectIsBootstrapping
} from '@cf/features/auth/state/auth.slice'
import Login from '@cfPages/SignIn/Login'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

/**
 * login: loading gate + redirect authenticated users to home shell.
 * */
export default function LoginPage() {
  const bootstrapping = useSelector(selectIsBootstrapping)
  const status = useSelector(selectAuthStatus)

  if (bootstrapping) {
    return <div style={{ padding: 24 }}>Loading…</div>
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <Login />
}
