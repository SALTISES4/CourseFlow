import { UserRegisterPayload } from '@cf/api/auth'
import {
  clearAuthError,
  register,
  selectAuthError
} from '@cf/features/auth/state/auth.slice'
import { AppDispatch } from '@cf/redux/store'
import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { ChangeEvent, FormEvent, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import * as Styled from '../styles'

type StateType = {
  pending: boolean
  user: UserRegisterPayload
}

function RegisterPage() {
  const { t } = useTranslation('auth')
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const error = useSelector(selectAuthError)
  const [state, setState] = useState<StateType>({
    pending: false,
    user: {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    }
  })

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      dispatch(clearAuthError())
      const result = await dispatch(register(state.user))
      if (register.fulfilled.match(result)) {
        navigate('/', { replace: true })
      }
    },
    [dispatch, navigate, state.user]
  )

  const onInputChange = useCallback((field: keyof StateType['user']) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setState(
        produce((draft) => {
          draft.user[field] = e.target.value
        })
      )
    }
  }, [])

  return (
    <Styled.Page>
      <Styled.Paper elevation={1}>
        <Styled.Form component="form" onSubmit={onSubmit}>
          <Styled.LogoWrap>
            <CFLogo />
            <Typography component="h2">CourseFlow</Typography>
          </Styled.LogoWrap>
          <Typography variant="body1">
            {t('registration.heading')}
          </Typography>
          {error ? (
            <Typography color="error" role="alert">
              {error}
            </Typography>
          ) : null}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label={t('registerForm.firstName')}
                type="text"
                name="firstName"
                value={state.user.firstName}
                onChange={onInputChange('firstName')}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={t('registerForm.lastName')}
                type="text"
                name="lastName"
                value={state.user.lastName}
                onChange={onInputChange('lastName')}
                fullWidth
              />
            </Grid>
          </Grid>
          <TextField
            label={t('loginForm.email')}
            type="email"
            name="email"
            value={state.user.email}
            onChange={onInputChange('email')}
            fullWidth
            required
          />
          <TextField
            label={t('loginForm.password')}
            type="password"
            name="password"
            value={state.user.password}
            onChange={onInputChange('password')}
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={state.pending}
            fullWidth
          >
            {state.pending
              ? t('registration.creating')
              : t('registration.submit')}
          </Button>
          <Typography variant="body1">
            {t('registration.backToLogin')}{' '}
            <Link href="/login">{t('loginForm.submit')}</Link>
          </Typography>
        </Styled.Form>
      </Styled.Paper>
    </Styled.Page>
  )
}

export default RegisterPage
