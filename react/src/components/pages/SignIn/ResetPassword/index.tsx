import { requestPasswordResetRequest } from '@cf/api/auth'
import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSnackbar } from 'notistack'
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as Styled from '../styles'

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function BrandLockup() {
  return (
    <Styled.LogoWrap>
      <CFLogo />
      <Typography component="span">CourseFlow</Typography>
    </Styled.LogoWrap>
  )
}

function PasswordRecoveryPage() {
  const { t } = useTranslation('auth')
  const { enqueueSnackbar } = useSnackbar()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [pending, setPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const pendingRef = useRef(false)

  const normalizedEmail = email.trim()
  const emailIsValid = EMAIL_PATTERN.test(normalizedEmail)
  const validationMessage = touched
    ? normalizedEmail.length === 0
      ? t('resetPassword.request.validation.emailRequired')
      : !emailIsValid
        ? t('resetPassword.request.validation.invalidEmailFormat')
        : ''
    : ''

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (pendingRef.current || !emailIsValid) {
        setTouched(true)
        return
      }

      pendingRef.current = true
      setPending(true)
      try {
        await requestPasswordResetRequest({ email })
        setSubmitted(true)
      } catch {
        enqueueSnackbar(t('resetPassword.request.messages.failed'), {
          variant: 'error',
          autoHideDuration: 5000
        })
      } finally {
        pendingRef.current = false
        setPending(false)
      }
    },
    [email, emailIsValid, enqueueSnackbar, t]
  )

  const onEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
    setTouched(true)
  }, [])

  return (
    <Styled.Page data-testid="forgot-password-page">
      <Styled.Paper elevation={1}>
        {submitted ? (
          <Styled.Form>
            <BrandLockup />
            <Typography component="h1" variant="h6">
              {t('resetPassword.heading')}
            </Typography>
            <Typography role="status">
              {t('resetPassword.request.messages.sent')}
            </Typography>
          </Styled.Form>
        ) : (
          <Styled.Form
            component="form"
            data-testid="forgot-password-form"
            onSubmit={onSubmit}
          >
            <BrandLockup />
            <Typography component="h1" variant="h6">
              {t('resetPassword.heading')}
            </Typography>
            <TextField
              label={t('loginForm.email')}
              type="email"
              name="email"
              value={email}
              onChange={onEmailChange}
              onBlur={() => setTouched(true)}
              error={Boolean(validationMessage)}
              helperText={validationMessage || undefined}
              fullWidth
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={pending || !emailIsValid}
              fullWidth
            >
              {pending
                ? t('resetPassword.request.submitting')
                : t('resetPassword.submit')}
            </Button>
          </Styled.Form>
        )}
      </Styled.Paper>
    </Styled.Page>
  )
}

export default PasswordRecoveryPage
