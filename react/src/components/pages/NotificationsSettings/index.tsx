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
import React, { useEffect, useReducer } from 'react'

const PageTitle = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

// @todo types
// NOTE: Using reducer here in anticipation of more complex settings page
// with various different controls
function reducer(state, action) {
  switch (action.type) {
    case 'SET_UPDATES':
      return {
        ...state,
        notifications: action.value
      }
  }

  return state
}

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

  // const { mutate } = useMutation<NotificationSettingsUpdateQueryResp>({
  //   mutationFn: updateNotificationSettings,
  //   onSuccess: (newNotificationsValue) => {
  //     // Dispatch the action to update local state after the API call is successful
  //     dispatch({
  //       type: 'SET_UPDATES',
  //       value: newNotificationsValue
  //     })
  //   },
  //   onError: (error) => {
  //     console.error('Error updating notifications:', error)
  //   }
  // })

  const [mutate, { isSuccess, isError, data: updateData }] =
    useUpdateNotificationSettingsMutation()

  /*******************************************************
   *
   *******************************************************/
  const [state, dispatch] = useReducer(reducer, {
    notifications: false
  })

  useEffect(() => {
    if (isSuccess) {
      dispatch({
        type: 'SET_UPDATES',
        value: updateData
      })
    }

    if (isError) {
      console.error('Error updating notifications:', error)
    }
  }, [isSuccess, isError, updateData])

  useEffect(() => {
    if (data) {
      dispatch({
        type: 'SET_UPDATES',
        value: data.dataPackage.formData.receiveNotifications
      })
    }
  }, [data])

  /*******************************************************
   * HANDLERS
   *******************************************************/
  function onUpdatesSwitchChange(e) {
    const newState = {
      ...state,
      notifications: !state.notifications
    }

    mutate(newState)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <OuterContentWrap>
      <PageTitle>
        <Typography variant="h1">{strings.notification_settings}</Typography>
      </PageTitle>

      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={state.notifications}
              onChange={onUpdatesSwitchChange}
            />
          }
          label={strings.product_updates_agree}
        />
      </FormGroup>
    </OuterContentWrap>
  )
}

export default NotificationsSettingsPage
