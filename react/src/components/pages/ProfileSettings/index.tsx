import {languageOptions} from "@cf/constants";
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { OuterContentWrap } from '@cf/mui/helper'
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
import {
  ProfileSettingsArgs,
  useGetProfileSettingsQuery,
  useUpdateProfileSettingsMutation
} from '@XMLHTTP/API/user.rtk'
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

type FormValues = ProfileSettingsArgs

const projectSchema = z.object({
  firstName: z.string().min(1, { message: 'First Name is required' }).max(200),
  lastName: z.string().min(1, { message: 'Last Name is required' }).max(200),
  language: z.string().min(1, { message: 'Language is required' }).max(200)
})

const ProfileSettingsPage = () => {
  /*******************************************************
   * QUERY HOOKS
   *******************************************************/
  const { data, error, isLoading, isError } = useGetProfileSettingsQuery()
  const [mutate] = useUpdateProfileSettingsMutation()

  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * FORM HOOK
   *******************************************************/
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {}
  })

  /*******************************************************
   * LIFE CYCLE HOOKS
   *******************************************************/

  useEffect(() => {
    if (data) {
      reset({
        firstName: data.dataPackage.firstName,
        lastName: data.dataPackage.lastName,
        language: data.dataPackage.language
      })
    }
  }, [data, reset])

  /*******************************************************
   * HANDLERS
   *******************************************************/
  const onFormSubmit = async (formData: FormValues) => {
    try {
      const resp = await mutate(formData).unwrap()
      onSuccess(resp)
    } catch (err) {
      onError(err)
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  if (isLoading) {
    return <Loader />
  }

  console.log(getValues())

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
            <FormControl component="fieldset" error={!!errors.language}>
              <FormLabel component="legend">
                {strings.languagePreferences}
              </FormLabel>
              <Controller
                name="language"
                control={control}
                render={({ field }) => {
                  console.log('field')
                  console.log(field)
                  return (
                    <RadioGroup
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      // Update the value on change
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
