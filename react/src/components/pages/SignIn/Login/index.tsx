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
import { ChangeEvent, FormEvent, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'

import * as Styled from '../styles'

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+$/

type LoginField = 'email' | 'password'

function LoginPage() {
  const { t } = useTranslation('auth')
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const pending = useSelector(selectLoginPending)
  const authError = useSelector(selectAuthError)
  const from = location.state?.from?.pathname ?? '/'

  const [state, setState] = useState({
    email: '',
    password: ''
  })
  const [touched, setTouched] = useState<Record<LoginField, boolean>>({
    email: false,
    password: false
  })

  const normalizedEmail = state.email.trim()
  const emailIsValid = EMAIL_PATTERN.test(normalizedEmail)
  const passwordIsValid = state.password.length > 0
  const formIsValid = emailIsValid && passwordIsValid

  const emailValidationMessage = touched.email
    ? normalizedEmail.length === 0
      ? t('loginForm.validation.emailRequired')
      : !emailIsValid
        ? t('loginForm.validation.invalidEmailFormat')
        : ''
    : ''
  const passwordValidationMessage =
    touched.password && !passwordIsValid
      ? t('loginForm.validation.passwordRequired')
      : ''

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (pending || !formIsValid) {
        setTouched({ email: true, password: true })
        return
      }
      dispatch(clearAuthError())
      const result = await dispatch(
        login({ email: state.email, password: state.password })
      )
      if (login.fulfilled.match(result)) {
        navigate(from, { replace: true })
      }
    },
    [
      dispatch,
      formIsValid,
      navigate,
      from,
      pending,
      state.email,
      state.password
    ]
  )

  const onInputChange = useCallback(
    (field: LoginField) => (e: ChangeEvent<HTMLInputElement>) => {
      setState((current) => ({ ...current, [field]: e.target.value }))
      if (authError) {
        dispatch(clearAuthError())
      }
    },
    [authError, dispatch]
  )

  const onInputBlur = useCallback(
    (field: LoginField) => () => {
      setTouched((current) => ({ ...current, [field]: true }))
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
          <Typography variant="body1">{t('loginForm.heading')}</Typography>
          {authError ? (
            <Typography color="error" role="alert">
              {authError}
            </Typography>
          ) : null}
          <TextField
            label={t('loginForm.email')}
            type="email"
            name="email"
            value={state.email}
            onChange={onInputChange('email')}
            onBlur={onInputBlur('email')}
            error={Boolean(emailValidationMessage)}
            helperText={emailValidationMessage || undefined}
            fullWidth
            required
          />
          <TextField
            label={t('loginForm.password')}
            type="password"
            name="password"
            value={state.password}
            onChange={onInputChange('password')}
            onBlur={onInputBlur('password')}
            error={Boolean(passwordValidationMessage)}
            helperText={passwordValidationMessage || undefined}
            fullWidth
            required
          />
          <Link component={RouterLink} to="/password-reset">
            {t('loginForm.forgotPassword')}
          </Link>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={pending || !formIsValid}
            fullWidth
          >
            {pending ? t('loginForm.loggingIn') : t('loginForm.submit')}
          </Button>
          <Typography variant="body1">
            <span>{t('loginForm.noAccount')} </span>
            <Link href="/register">{t('loginForm.register')}</Link>
          </Typography>
        </Styled.Form>
      </Styled.Paper>
    </Styled.Page>
  )
}

export default LoginPage
