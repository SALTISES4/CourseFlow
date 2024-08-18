import React, { useReducer } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { OuterContentWrap } from '@cfModule/mui/helper'
import { API_POST } from '@XMLHTTP/CallWrapper'

const PageTitle = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

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

const NotificationsSettingsPage = ({ formData }) => {
  const [state, dispatch] = useReducer(reducer, {
    notifications: formData.receiveNotifications
  })

  function onUpdatesSwitchChange(e) {
    const newState = {
      ...state,
      notifications: !state.notifications
    }

    // post to the appropriate URL
    API_POST(
      COURSEFLOW_APP.path.json_api.update_notifications_settings,
      newState
    ).then(() => {
      // and if successful, dispatch the action to update local state
      dispatch({
        type: 'SET_UPDATES',
        value: newState.notifications
      })
    })
  }

  return (
    <OuterContentWrap narrow>
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
