import {
  getMyNotificationSettingsOptions,
  getMyNotificationSettingsQueryKey,
  patchMyNotificationSettingsMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { OuterContentWrap } from '@cf/mui/helper'
import strings from '@cf/utility/strings'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

const PageTitle = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

const NotificationsSettingsPage = () => {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    ...getMyNotificationSettingsOptions()
  })

  const patchNotificationSettings = useMutation({
    ...patchMyNotificationSettingsMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getMyNotificationSettingsQueryKey()
      })
    }
  })

  const { onError, onSuccess } = useGenericMsgHandler()

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      notifications: false
    }
  })

  useEffect(() => {
    if (data?.item) {
      reset({ notifications: data.item.notificationsActive })
    }
  }, [data, reset])

  const onSwitchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue('notifications', event.target.checked)
    await handleSubmit(async (formData) => {
      try {
        await patchNotificationSettings.mutateAsync({
          body: {
            notificationsActive: formData.notifications
          }
        })
        onSuccess({})
      } catch (err) {
        onError(err)
      }
    })()
  }

  return (
    <OuterContentWrap>
      <PageTitle>
        <Typography variant="h1">{strings.notificationSettings}</Typography>
      </PageTitle>

      <form>
        <FormGroup>
          <Controller
            name="notifications"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    {...field}
                    onChange={onSwitchChange}
                    checked={field.value}
                  />
                }
                label={strings.productUpdatesAgree}
              />
            )}
          />
        </FormGroup>
      </form>
    </OuterContentWrap>
  )
}

export default NotificationsSettingsPage
