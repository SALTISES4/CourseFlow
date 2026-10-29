import {
  AuthRequestError,
  confirmPasswordResetRequest,
  validatePasswordResetTokenRequest
} from '@cf/api/auth'
import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSnackbar } from 'notistack'
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import * as Styled from '../styles'

const PASSWORD_STRENGTH = {
  minimumLength: 12,
  letter: /[a-zA-Z]/,
  number: /\d/,
  symbol: /[^a-zA-Z0-9]/
}

type LinkStatus = 'validating' | 'valid' | 'invalid' | 'error'
type PasswordField = 'password' | 'confirmPassword'

function passwordIsStrong(password: string) {
  return (
    password.length >= PASSWORD_STRENGTH.minimumLength &&
    PASSWORD_STRENGTH.letter.test(password) &&
    PASSWORD_STRENGTH.number.test(password) &&
    PASSWORD_STRENGTH.symbol.test(password)
  )
}

function BrandLockup() {
  return (
    <Styled.LogoWrap>
      <CFLogo />
      <Typography component="span">CourseFlow</Typography>
    </Styled.LogoWrap>
  )
}

function PasswordResetConfirmationPage() {
  const { t } = useTranslation('auth')
  const { enqueueSnackbar } = useSnackbar()
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<LinkStatus>('validating')
  const [validationAttempt, setValidationAttempt] = useState(0)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const [values, setValues] = useState({
    password: '',
    confirmPassword: ''
  })
  const [touched, setTouched] = useState<Record<PasswordField, boolean>>({
    password: false,
    confirmPassword: false
  })

  const credentials = useMemo(() => {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''))
    const uid = params.get('uid')
    const token = params.get('token')
    return uid && token ? { uid, token } : null
  }, [location.hash])

  useEffect(() => {
    let cancelled = false
    setStatus('validating')
    if (!credentials) {
      setStatus('invalid')
      return () => {
        cancelled = true
      }
    }

    void validatePasswordResetTokenRequest(credentials)
      .then((response) => {
        if (!cancelled) {
          setStatus(response.valid ? 'valid' : 'invalid')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error')
          enqueueSnackbar(
            t('resetPassword.confirm.messages.validationFailed'),
            {
              variant: 'error',
              autoHideDuration: 5000
            }
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [credentials, enqueueSnackbar, t, validationAttempt])

  const passwordIsValid = passwordIsStrong(values.password)
  const confirmationIsValid =
    values.confirmPassword.length > 0 &&
    values.confirmPassword === values.password
  const formIsValid = passwordIsValid && confirmationIsValid

  const passwordValidationMessage = touched.password
    ? values.password.length === 0
      ? t('resetPassword.confirm.validation.passwordRequired')
      : !passwordIsValid
        ? t('resetPassword.confirm.passwordGuidelines')
        : ''
    : ''
  const confirmationValidationMessage = touched.confirmPassword
    ? values.confirmPassword.length === 0
      ? t('resetPassword.confirm.validation.confirmRequired')
      : !confirmationIsValid
        ? t('resetPassword.confirm.validation.mismatch')
        : ''
    : ''

  const onInputChange = useCallback(
    (field: PasswordField) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      setTouched((current) => ({ ...current, [field]: true }))
    },
    []
  )

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (pendingRef.current || !formIsValid || !credentials) {
        setTouched({ password: true, confirmPassword: true })
        return
      }

      pendingRef.current = true
      setPending(true)
      try {
        await confirmPasswordResetRequest({
          ...credentials,
          newPassword: values.password
        })
        enqueueSnackbar(t('resetPassword.confirm.messages.succeeded'), {
          variant: 'success',
          autoHideDuration: 5000
        })
        navigate('/login/', { replace: true })
      } catch (error) {
        if (
          error instanceof AuthRequestError &&
          error.code === 'password_reset_link_invalid'
        ) {
          setStatus('invalid')
          return
        }
        enqueueSnackbar(t('resetPassword.confirm.messages.failed'), {
          variant: 'error',
          autoHideDuration: 5000
        })
      } finally {
        pendingRef.current = false
        setPending(false)
      }
    },
    [credentials, enqueueSnackbar, formIsValid, navigate, t, values.password]
  )

  if (status === 'validating') {
    return (
      <Styled.Page data-testid="forgot-password-confirm-page">
        <CircularProgress aria-label={t('resetPassword.confirm.validating')} />
      </Styled.Page>
    )
  }

  if (status === 'invalid') {
    return (
      <Styled.Page data-testid="forgot-password-invalid-link-page">
        <Styled.Paper elevation={1}>
          <Styled.Form>
            <BrandLockup />
            <Typography component="h1" variant="h6">
              {t('resetPassword.invalidLink.heading')}
            </Typography>
            <Typography>
              {t('resetPassword.invalidLink.explanation')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/password-reset')}
              fullWidth
            >
              {t('resetPassword.invalidLink.requestNew')}
            </Button>
          </Styled.Form>
        </Styled.Paper>
      </Styled.Page>
    )
  }

  if (status === 'error') {
    return (
      <Styled.Page data-testid="forgot-password-confirm-error-page">
        <Styled.Paper elevation={1}>
          <Styled.Form>
            <BrandLockup />
            <Typography component="h1" variant="h6">
              {t('resetPassword.heading')}
            </Typography>
            <Typography>
              {t('resetPassword.confirm.messages.validationFailed')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setValidationAttempt((current) => current + 1)}
              fullWidth
            >
              {t('resetPassword.confirm.retry')}
            </Button>
          </Styled.Form>
        </Styled.Paper>
      </Styled.Page>
    )
  }

  return (
    <Styled.Page data-testid="forgot-password-confirm-page">
      <Styled.Paper elevation={1}>
        <Styled.Form
          component="form"
          data-testid="forgot-password-confirm-form"
          onSubmit={onSubmit}
        >
          <BrandLockup />
          <Typography component="h1" variant="h6">
            {t('resetPassword.heading')}
          </Typography>
          <TextField
            label={t('resetPassword.confirm.fields.password')}
            type="password"
            name="password"
            value={values.password}
            onChange={onInputChange('password')}
            onBlur={() =>
              setTouched((current) => ({ ...current, password: true }))
            }
            error={Boolean(passwordValidationMessage)}
            helperText={passwordValidationMessage || undefined}
            fullWidth
            required
          />
          <TextField
            label={t('resetPassword.confirm.fields.confirmPassword')}
            type="password"
            name="confirmPassword"
            value={values.confirmPassword}
            onChange={onInputChange('confirmPassword')}
            onBlur={() =>
              setTouched((current) => ({ ...current, confirmPassword: true }))
            }
            error={Boolean(confirmationValidationMessage)}
            helperText={confirmationValidationMessage || undefined}
            fullWidth
            required
          />
          <Typography variant="body2">
            {t('resetPassword.confirm.passwordGuidelines')}
          </Typography>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={pending || !formIsValid}
            fullWidth
          >
            {pending
              ? t('resetPassword.confirm.submitting')
              : t('resetPassword.submit')}
          </Button>
        </Styled.Form>
      </Styled.Paper>
    </Styled.Page>
  )
}

export default PasswordResetConfirmationPage
