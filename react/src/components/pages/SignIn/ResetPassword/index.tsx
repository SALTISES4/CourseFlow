import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { ChangeEvent, FormEvent, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as Styled from '../styles'

function RegisterPage() {
  const { t } = useTranslation('auth')
  const [state, setState] = useState({
    pending: false,
    email: ''
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    console.log('submitted register form', e.target)
    setState(
      produce((draft) => {
        draft.pending = true

        setTimeout(() => {
          draft.pending = false
        }, 2000)
      })
    )
  }

  const onEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState(
      produce((draft) => {
        draft.email = e.target.value
      })
    )
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
            {t('resetPassword.heading')}
          </Typography>
          <TextField
            label={t('loginForm.email')}
            type="email"
            name="email"
            value={state.email}
            onChange={onEmailChange}
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
            {t('resetPassword.submit')}
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
