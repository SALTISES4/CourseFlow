import { CourseFlowApiError } from '@cf/api/apiError'
import { patchMyProfilePasswordMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { _t } from '@cf/utility/Utility.class'
import { OuterContentWrap } from '@cfMUI/helper'
import { zodResolver } from '@hookform/resolvers/zod'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
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

const passwordGuidelines = _t(
  'Your password must contain at least 12 characters and include a mix of numbers, letters and symbols'
)

const passwordSchema = z
  .object({
    oldPass: z
      .string()
      .min(1, { message: _t('Current password is required') })
      .max(200),

    newPass: z
      .string()
      .min(1, { message: _t('New password is required') })
      .refine(
        (password) =>
          password.length >= 12 &&
          /[a-zA-Z]/.test(password) &&
          /\d/.test(password) &&
          /[^a-zA-Z0-9]/.test(password),
        {
          message: passwordGuidelines
        }
      ),

    newPassConfirm: z
      .string()
      .min(1, { message: _t('Confirm new password is required') })
  })
  .superRefine((data, context) => {
    if (data.oldPass && data.newPass && data.oldPass === data.newPass) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPass'],
        message: _t('New password must be different from your current password')
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
        message: _t('Passwords do not match')
      })
    }
  })

type FormValues = z.infer<typeof passwordSchema>

const PasswordResetPage = () => {
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
      onSuccess({ message: _t('Your password has been successfully reset') })
      reset()
    } catch (err) {
      const errorBody = err instanceof CourseFlowApiError ? err.body : err
      if (typeof errorBody === 'object' && errorBody !== null) {
        if ('password' in errorBody) {
          setError('oldPass', {
            type: 'server',
            message: String(errorBody.password)
          })
          return
        }
        if ('newPassword' in errorBody) {
          setError('newPass', {
            type: 'server',
            message: String(errorBody.newPassword)
          })
          return
        }
      }
      onError({
        message: _t('We encountered an issue and your password was not reset')
      })
    }
  }

  return (
    <OuterContentWrap narrow>
      <StyledTitleBox>
        <Typography variant="h1">{_t('Password reset')}</Typography>
      </StyledTitleBox>

      <StyledFormBox>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Box sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                {...register('oldPass')}
                type="password"
                required
                label={_t('Current password')}
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
                label={_t('New password')}
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
                label={_t('Confirm new password')}
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
              {_t('Reset password')}
            </Button>
          </Box>
        </form>
      </StyledFormBox>
    </OuterContentWrap>
  )
}

export default PasswordResetPage
