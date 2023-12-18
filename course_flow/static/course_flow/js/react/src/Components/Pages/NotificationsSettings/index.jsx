import React, { useEffect, useReducer } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { OuterContentWrap } from '@cfModule/mui/helper'
import useApi from '@cfModule/hooks/useApi'
import { API_POST } from '@XMLHTTP/PostFunctions'

const PageTitle = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

// NOTE: Using reducer here in anitipation of more complex settings page
// with various different controls
function reducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return {
        ...state,
        ...action.payload
      }
    case 'SET_UPDATES':
      return {
        ...state,
        updates: action.value
      }
  }

  return state
}

const NotificationsSettingsPage = () => {
  const [state, dispatch] = useReducer(reducer, {
    updates: false
  })

  const [apiData, loading, error] = useApi(
    COURSEFLOW_APP.config.json_api_paths.update_notifications_settings
  )

  // after the apiData is loaded in, set it as state so it can be used internally
  useEffect(() => {
    if (!loading) {
      dispatch({
        type: 'SET_INITIAL_STATE',
        payload: apiData
      })
    }
  }, [loading])

  if (loading || error) {
    return null
  }

  function onUpdatesSwitchChange(e) {
    const newState = {
      ...state,
      updates: !state.updates
    }

    // post to the appropriate URL
    API_POST(
      COURSEFLOW_APP.config.json_api_paths.update_notifications_settings,
      newState
    ).then((response) => {
      console.log(
        'API_POST\n',
        newState,
        '\nto\n',
        COURSEFLOW_APP.config.json_api_paths.update_notifications_settings,
        '\ngot\n',
        response
      )

      // and if successful, dispatch the action to update local state
      dispatch({
        type: 'SET_UPDATES',
        value: !state.updates
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
            <Switch checked={state.updates} onChange={onUpdatesSwitchChange} />
          }
          label={COURSEFLOW_APP.strings.product_updates_agree}
        />
      </FormGroup>
    </OuterContentWrap>
  )
}

export default NotificationsSettingsPage
