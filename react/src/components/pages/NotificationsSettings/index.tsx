import React, { useEffect, useReducer } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { OuterContentWrap } from '@cfModule/mui/helper'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  NotificationSettingsQueryResp,
  NotificationSettingsUpdateQueryResp
} from '@XMLHTTP/types/query.js'
import {
  fetchNotificationSettings,
  updateNotificationSettings
} from '@XMLHTTP/API/user'

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
  const { data, error, isLoading, isError } =
    useQuery<NotificationSettingsQueryResp>({
      queryKey: ['fetchNotificationSettings'],
      queryFn: fetchNotificationSettings
    })

  const { mutate } = useMutation<NotificationSettingsUpdateQueryResp>({
    mutationFn: updateNotificationSettings,
    onSuccess: (newNotificationsValue) => {
      // Dispatch the action to update local state after the API call is successful
      dispatch({
        type: 'SET_UPDATES',
        value: newNotificationsValue
      })
    },
    onError: (error) => {
      console.error('Error updating notifications:', error)
    }
  })

  /*******************************************************
   *
   *******************************************************/
  const [state, dispatch] = useReducer(reducer, {
    notifications: false
  })

  useEffect(() => {
    if (data) {
      dispatch({
        type: 'SET_UPDATES',
        value: data.data_package.formData.receiveNotifications
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
        <Typography variant="h1">
          {COURSEFLOW_APP.strings.notification_settings}
        </Typography>
      </PageTitle>

      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={state.notifications}
              onChange={onUpdatesSwitchChange}
            />
          }
          label={COURSEFLOW_APP.strings.product_updates_agree}
        />
      </FormGroup>
    </OuterContentWrap>
  )
}

export default NotificationsSettingsPage
