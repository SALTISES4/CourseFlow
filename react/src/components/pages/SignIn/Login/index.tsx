import {
  clearAuthError,
  login,
  selectAuthError,
  selectLoginPending
} from '@cf/features/auth/state/auth.slice'
import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import type { AppDispatch } from '@cfRedux/store'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  useCallback,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import * as Styled from '../styles'

function LoginPage() {
  const { t } = useTranslation('auth')
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const pending = useSelector(selectLoginPending)
  const error = useSelector(selectAuthError)
  const from = location.state?.from?.pathname ?? '/'

  const [state, setState] = useState({
    email: '',
    password: ''
  })

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      dispatch(clearAuthError())
      const result = await dispatch(
        login({ email: state.email, password: state.password })
      )
      if (login.fulfilled.match(result)) {
        navigate(from, { replace: true })
      }
    },
    [dispatch, navigate, from, state.email, state.password]
  )

  const onInputChange = useCallback((field: keyof typeof state) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setState(
        produce((draft) => {
          draft[field] = e.target.value
        })
      )
    }
  }, [])

  const onResetPasswordClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      console.log('reset password yo!')
    },
    []
  )

  return (
    <Styled.Page>
      <Styled.Paper elevation={1}>
        <Styled.Form component="form" onSubmit={onSubmit}>
          <Styled.LogoWrap>
            <CFLogo />
            <Typography component="h2">CourseFlow</Typography>
          </Styled.LogoWrap>
          <Typography variant="body1">
            {t('loginForm.heading')}
          </Typography>
          {error ? (
            <Typography color="error" role="alert">
              {error}
            </Typography>
          ) : null}
          <TextField
            label={t('loginForm.email')}
            type="email"
            name="email"
            value={state.email}
            onChange={onInputChange('email')}
            fullWidth
            required
          />
          <TextField
            label={t('loginForm.password')}
            type="password"
            name="password"
            value={state.password}
            onChange={onInputChange('password')}
            fullWidth
            required
          />
          <Link href="#" onClick={onResetPasswordClick}>
            {t('loginForm.forgotPassword')}
          </Link>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={pending}
            fullWidth
          >
            {pending ? t('loginForm.loggingIn') : t('loginForm.submit')}
          </Button>
          <Typography variant="body1">
            {t('loginForm.noAccount')}{' '}
            <Link href="/register">{t('loginForm.register')}</Link>
          </Typography>
        </Styled.Form>
      </Styled.Paper>
    </Styled.Page>
  )
}

export default LoginPage
