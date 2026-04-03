import {
  getMyProfileSettingsOptions,
  getMyProfileSettingsQueryKey,
  patchMyProfileSettingsMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { OuterContentWrap } from '@cf/mui/helper'
import { languageOptions } from '@cf/utility/constants'
import strings from '@cf/utility/strings'
import Loader from '@cfComponents/UIPrimitives/Loader'
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
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
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

type FormValues = {
  firstName: string
  lastName: string
  languagePreference: string
}

const projectSchema = z.object({
  firstName: z.string().min(1, { message: 'First Name is required' }).max(200),
  lastName: z.string().min(1, { message: 'Last Name is required' }).max(200),
  languagePreference: z
    .string()
    .min(1, { message: 'Language is required' })
    .max(200)
})

const ProfileSettingsPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    ...getMyProfileSettingsOptions()
  })

  const patchProfileSettings = useMutation({
    ...patchMyProfileSettingsMutation(),
    onSuccess: async () => {
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
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {}
  })

  useEffect(() => {
    if (data?.item) {
      reset({
        firstName: data.item.firstName,
        lastName: data.item.lastName,
        languagePreference: data.item.languagePreference
      })
    }
  }, [data, reset])

  const onFormSubmit = async (formData: FormValues) => {
    try {
      const resp = await patchProfileSettings.mutateAsync({
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          languagePreference: formData.languagePreference
        }
      })
      onSuccess(resp)
    } catch (err) {
      onError(err)
    }
  }

  if (isLoading) {
    return <Loader />
  }

  return (
    <OuterContentWrap narrow>
      <StyledTitleBox>
        <Typography variant="h1">{strings.profileSettings}</Typography>
      </StyledTitleBox>

      <StyledFormBox>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Box sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                label={strings.firstName}
                {...register('firstName')}
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
                label={strings.lastName}
                error={!!errors.lastName}
                helperText={errors && errors.lastName?.message}
                variant="standard"
              />
            </FormControl>
          </Box>

          <Box sx={{ mb: 8 }}>
            <FormControl component="fieldset" error={!!errors.languagePreference}>
              <FormLabel component="legend">
                {strings.languagePreferences}
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
                      {languageOptions.map((item) => {
                        return (
                          <FormControlLabel
                            key={item.value}
                            value={item.value}
                            control={<Radio />}
                            label={item.label}
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
            <Button variant="contained" type="submit" disabled={!isDirty}>
              {strings.updateProfile}
            </Button>
          </Box>
        </form>
      </StyledFormBox>
    </OuterContentWrap>
  )
}

export default ProfileSettingsPage
