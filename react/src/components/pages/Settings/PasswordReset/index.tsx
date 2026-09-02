import { getApiFieldError } from '@cf/api/apiError'
import { patchMyProfilePasswordMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { OuterContentWrap } from '@cfMUI/helper'
import { zodResolver } from '@hookform/resolvers/zod'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

const StyledTitleBox = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

const StyledFormBox = styled(Box)({
  '& .MuiFormControl-root': {
    width: '100%'
  }
})

const createPasswordSchema = (t: TFunction<'profile'>) => {
  const passwordGuidelines = t('password.validation.strength')

  return z
    .object({
      oldPass: z
        .string()
        .min(1, { message: t('password.validation.currentRequired') })
        .max(200),

      newPass: z
        .string()
        .min(1, { message: t('password.validation.newRequired') })
        .refine(
          (password) =>
            password.length >= 12 &&
            /[a-zA-Z]/.test(password) &&
            /\d/.test(password) &&
            /[^a-zA-Z0-9]/.test(password),
          { message: passwordGuidelines }
        ),

      newPassConfirm: z
        .string()
        .min(1, { message: t('password.validation.confirmRequired') })
    })
    .superRefine((data, context) => {
      if (data.oldPass && data.newPass && data.oldPass === data.newPass) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['newPass'],
          message: t('password.validation.newMatchesCurrent')
        })
      }

      if (
        data.newPass &&
        data.newPassConfirm &&
        data.newPass !== data.newPassConfirm
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['newPassConfirm'],
          message: t('password.validation.mismatch')
        })
      }
    })
}

type FormValues = z.infer<ReturnType<typeof createPasswordSchema>>

const PasswordResetPage = () => {
  const { t } = useTranslation('profile')
  const passwordSchema = useMemo(() => createPasswordSchema(t), [t])
  const passwordGuidelines = t('password.validation.strength')
  const patchMyProfilePassword = useMutation({
    ...patchMyProfilePasswordMutation()
  })

  const { onError, onSuccess } = useGenericMsgHandler()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPass: '',
      newPass: '',
      newPassConfirm: ''
    }
  })

  const onFormSubmit = async (formData: FormValues) => {
    try {
      await patchMyProfilePassword.mutateAsync({
        body: {
          password: formData.oldPass,
          newPassword: formData.newPass
        }
      })
      onSuccess({ localizedMessage: t('password.messages.updated') })
      reset()
    } catch (err) {
      const currentPasswordIssue = getApiFieldError(err, 'password')
      if (currentPasswordIssue?.code === 'current_password_incorrect') {
        setError('oldPass', {
          type: 'server',
          message: t('password.validation.currentIncorrect')
        })
        return
      }

      const newPasswordIssue = getApiFieldError(err, 'newPassword')
      if (newPasswordIssue) {
        const message =
          newPasswordIssue.code === 'new_password_required'
            ? t('password.validation.newRequired')
            : newPasswordIssue.code === 'new_password_matches_current'
              ? t('password.validation.newMatchesCurrent')
              : newPasswordIssue.code === 'password_strength_required'
                ? t('password.validation.strength')
                : null
        if (message) {
          setError('newPass', { type: 'server', message })
          return
        }
      }
      onError({
        localizedMessage: t('password.messages.updateFailed')
      })
    }
  }

  return (
    <OuterContentWrap narrow>
      <StyledTitleBox>
        <Typography variant="h1">{t('password.title')}</Typography>
      </StyledTitleBox>

      <StyledFormBox>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Box sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                {...register('oldPass')}
                type="password"
                required
                label={t('password.fields.current')}
                error={!!errors.oldPass}
                helperText={errors && errors.oldPass?.message}
                variant="standard"
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                {...register('newPass', { deps: ['newPassConfirm'] })}
                type="password"
                required
                label={t('password.fields.new')}
                error={!!errors.newPass}
                helperText={
                  (errors && errors.newPass?.message) ?? passwordGuidelines
                }
                variant="standard"
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                {...register('newPassConfirm')}
                type="password"
                required
                label={t('password.fields.confirm')}
                error={!!errors.newPassConfirm}
                helperText={errors && errors.newPassConfirm?.message}
                variant="standard"
              />
            </FormControl>
          </Box>

          <Box>
            <Button
              variant="contained"
              type="submit"
              disabled={
                !isDirty || !isValid || patchMyProfilePassword.isPending
              }
            >
              {t('password.actions.reset')}
            </Button>
          </Box>
        </form>
      </StyledFormBox>
    </OuterContentWrap>
  )
}

export default PasswordResetPage
