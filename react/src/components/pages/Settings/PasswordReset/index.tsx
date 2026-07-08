import { _t } from '@cf/utility/Utility.class'
import { OuterContentWrap } from '@cfMUI/helper'
import { zodResolver } from '@hookform/resolvers/zod'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
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

const projectSchema = z
  .object({
    oldPass: z
      .string()
      .min(1, { message: _t('Current password is required') })
      .max(200),

    newPass: z
      .string()
      .refine(
        (password) =>
          password.length >= 12 &&
          /[a-zA-Z]/.test(password) &&
          /\d/.test(password) &&
          /[^a-zA-Z0-9]/.test(password),
        {
          message: _t(
            'Your password must contain at least 12 characters and include a mix of numbers, letters and symbols.'
          )
        }
      ),

    newPassConfirm: z.string()
  })
  .refine((data) => data.newPass === data.newPassConfirm, {
    path: ['newPassConfirm'],
    message: _t('Passwords do not match.')
  })

type FormValues = z.infer<typeof projectSchema>

const PasswordResetPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    // mode: 'onChange', // NOTE: we could also do it a bit faster?
    resolver: zodResolver(projectSchema),
    defaultValues: {
      oldPass: '',
      newPass: '',
      newPassConfirm: ''
    }
  })

  const onFormSubmit = async (formData: FormValues) => {
    console.log('submitting with', formData)
    reset()
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
                {...register('newPass')}
                type="password"
                required
                label={_t('New password')}
                error={!!errors.newPass}
                helperText={
                  (errors && errors.newPass?.message) ??
                  _t(
                    'Your password must contain at least 12 characters and include a mix of numbers, letters and symbols.'
                  )
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
              disabled={!isDirty || !!Object.keys(errors).length}
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
