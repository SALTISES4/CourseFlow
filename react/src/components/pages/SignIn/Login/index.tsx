import { _t } from '@cf/utility/Utility.class'
import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import {
  clearAuthError,
  login,
  selectAuthError,
  selectLoginPending
} from '@cfRedux/slices/auth.slice'
import type { AppDispatch } from '@cfRedux/store'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FormEvent, MouseEvent, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

import * as Styled from '../styles'

function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const pending = useSelector(selectLoginPending)
  const error = useSelector(selectAuthError)
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearAuthError())
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) {
      navigate(from, { replace: true })
    }
  }

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
            {_t('Login to your CourseFlow account')}
          </Typography>
          {error ? (
            <Typography color="error" role="alert">
              {error}
            </Typography>
          ) : null}
          <TextField
            label={_t('Email')}
            type="email"
            name="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            fullWidth
            required
          />
          <TextField
            label={_t('Password')}
            type="password"
            name="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            fullWidth
            required
          />
          <Link href="#" onClick={onResetPasswordClick}>
            {_t('Forgot your password?')}
          </Link>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={pending}
            fullWidth
          >
            {_t(pending ? 'Logging in...' : 'Login')}
          </Button>
          <Typography variant="body1">
            {_t("Don't have an account?")}{' '}
            <Link href="/register">{_t('Register')}</Link>
          </Typography>
        </Styled.Form>
      </Styled.Paper>
    </Styled.Page>
  )
}

export default LoginPage
