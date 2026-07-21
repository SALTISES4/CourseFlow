import {
  getMyNotificationSettingsOptions,
  getMyNotificationSettingsQueryKey,
  patchMyNotificationSettingsMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import strings from '@cf/utility/strings'
import { _t } from '@cf/utility/Utility.class'
import { OuterContentWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChangeEvent, useEffect } from 'react'
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

  const { control, getValues, reset, setValue } = useForm({
    defaultValues: {
      notifications: false
    }
  })

  useEffect(() => {
    if (data?.item) {
      reset({ notifications: data.item.notificationsActive })
    }
  }, [data, reset])

  const onSwitchChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const previousValue = getValues('notifications')
    const nextValue = event.target.checked
    setValue('notifications', nextValue)

    try {
      const response = await patchNotificationSettings.mutateAsync({
        body: {
          notificationsActive: nextValue
        }
      })
      reset({ notifications: response.item.notificationsActive })
      onSuccess({
        message: _t('Your notification settings have been updated')
      })
    } catch {
      setValue('notifications', previousValue)
      onError({
        message: _t(
          'We encountered an issue and your notification settings were not updated'
        )
      })
    }
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
                    disabled={patchNotificationSettings.isPending}
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
