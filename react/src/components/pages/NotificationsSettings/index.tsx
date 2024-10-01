import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { OuterContentWrap } from '@cf/mui/helper'
import strings from '@cf/utility/strings'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation
} from '@XMLHTTP/API/user.rtk'
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
  /*******************************************************
   * QUERY HOOKS
   *******************************************************/
  const {
    data,
    error,
    isLoading,
    isError: isQueryError
  } = useGetNotificationSettingsQuery()

  const [mutate, { isSuccess, isError, data: updateData }] =
    useUpdateNotificationSettingsMutation()

  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * FORM HOOK
   *******************************************************/
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      notifications: false
    }
  })

  useEffect(() => {
    if (data) {
      reset({ notifications: data.dataPackage.receiveNotifications })
    }
  }, [data, reset])

  /*******************************************************
   * HANDLERS
   *******************************************************/
  const onSwitchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue('notifications', event.target.checked)
    await handleSubmit(async (data) => {
      try {
        const resp = await mutate(data).unwrap()
        onSuccess(resp)
      } catch (err) {
        onError(err)
      }
    })()
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <OuterContentWrap>
      <PageTitle>
        <Typography variant="h1">{strings.notification_settings}</Typography>
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
                label={strings.product_updates_agree}
              />
            )}
          />
        </FormGroup>
      </form>
    </OuterContentWrap>
  )
}

export default NotificationsSettingsPage
