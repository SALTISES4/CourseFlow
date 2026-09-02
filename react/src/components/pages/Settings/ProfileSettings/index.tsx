import { getApiFieldError } from '@cf/api/apiError'
import {
  getMyProfileSettingsOptions,
  getMyProfileSettingsQueryKey,
  patchMyProfileSettingsMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import {
  setAuthLanguagePreference
} from '@cf/features/auth/state/auth.slice'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { setAppLocale } from '@cf/i18n'
import { languageOptions } from '@cf/utility/constants'
import type { AppDispatch } from '@cfRedux/store'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { OuterContentWrap } from '@cfMUI/helper'
import { zodResolver } from '@hookform/resolvers/zod'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
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

const createProfileSchema = (t: TFunction<'profile'>) =>
  z.object({
    email: z.string(),

    firstName: z
      .string()
      .min(1, { message: t('validation.firstNameRequired') })
      .max(200, { message: t('validation.firstNameMax', { count: 200 }) }),

    lastName: z
      .string()
      .min(1, { message: t('validation.lastNameRequired') })
      .max(200, { message: t('validation.lastNameMax', { count: 200 }) }),

    languagePreference: z
      .string()
      .min(1, { message: t('validation.languageRequired') })
      .max(200)
  })

type FormValues = z.infer<ReturnType<typeof createProfileSchema>>
type FormField = keyof FormValues

const ProfileSettingsPage = () => {
  const { t } = useTranslation('profile')
  const { t: tCommon } = useTranslation('common')
  const profileSchema = useMemo(() => createProfileSchema(t), [t])
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  const { data, isLoading } = useQuery({
    ...getMyProfileSettingsOptions()
  })

  const patchProfileSettings = useMutation({
    ...patchMyProfileSettingsMutation(),
    onSuccess: async (response) => {
      await setAppLocale(response.item.languagePreference)
      dispatch(setAuthLanguagePreference(response.item.languagePreference))
      await queryClient.invalidateQueries({
        queryKey: getMyProfileSettingsQueryKey()
      })
    }
  })

  const { onError, onSuccess } = useGenericMsgHandler()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {}
  })

  useEffect(() => {
    if (data?.item) {
      reset({
        email: data.item.email,
        firstName: data.item.firstName,
        lastName: data.item.lastName,
        languagePreference: data.item.languagePreference
      })
    }
  }, [data, reset])

  const onFormSubmit = async (formData: FormValues) => {
    try {
      await patchProfileSettings.mutateAsync({
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          languagePreference: formData.languagePreference
        }
      })

      onSuccess({ localizedMessage: t('messages.updated') })
    } catch (err) {
      let hasFieldError = false
      const formFields: FormField[] = [
        'firstName',
        'lastName',
        'languagePreference'
      ]
      formFields.forEach((field) => {
        const issue = getApiFieldError(err, field)
        if (!issue) {
          return
        }

        const message = (() => {
          switch (issue.code) {
            case 'first_name_required':
              return t('validation.firstNameRequired')
            case 'first_name_too_long':
              return t('validation.firstNameMax', { count: 200 })
            case 'last_name_required':
              return t('validation.lastNameRequired')
            case 'last_name_too_long':
              return t('validation.lastNameMax', { count: 200 })
            case 'language_required':
              return t('validation.languageRequired')
            default:
              return null
          }
        })()

        if (!message) {
          return
        }
        hasFieldError = true
        setError(field, { message })
      })

      if (!hasFieldError) {
        onError({
          localizedMessage: t('messages.updateFailed')
        })
      }
    }
  }

  if (isLoading) {
    return <Loader />
  }

  return (
    <OuterContentWrap narrow>
      <StyledTitleBox>
        <Typography variant="h1">{t('title')}</Typography>
      </StyledTitleBox>

      <StyledFormBox>
        <form
          noValidate
          onSubmit={handleSubmit(onFormSubmit)}
          data-test-id="profile-settings-form"
        >
          <Box sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                {...register('email')}
                required
                disabled
                label={t('fields.email')}
                variant="standard"
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                {...register('firstName')}
                required
                label={t('fields.firstName')}
                error={!!errors.firstName}
                helperText={errors && errors.firstName?.message}
                variant="standard"
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                {...register('lastName')}
                required
                label={t('fields.lastName')}
                error={!!errors.lastName}
                helperText={errors && errors.lastName?.message}
                variant="standard"
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 8 }}>
            <FormControl
              component="fieldset"
              error={!!errors.languagePreference}
            >
              <FormLabel component="legend">
                {t('fields.language')}
              </FormLabel>
              <Controller
                name="languagePreference"
                control={control}
                render={({ field }) => {
                  return (
                    <RadioGroup
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      {languageOptions.map((language) => {
                        return (
                          <FormControlLabel
                            key={language}
                            value={language}
                            control={<Radio />}
                            label={
                              language === 'fr'
                                ? tCommon('language.french')
                                : tCommon('language.english')
                            }
                          />
                        )
                      })}
                    </RadioGroup>
                  )
                }}
              />
            </FormControl>
          </Box>

          <Box>
            <Button
              variant="contained"
              type="submit"
              disabled={
                !isDirty ||
                !!Object.keys(errors).length ||
                patchProfileSettings.isPending
              }
            >
              {t('actions.update')}
            </Button>
          </Box>
        </form>
      </StyledFormBox>
    </OuterContentWrap>
  )
}

export default ProfileSettingsPage
