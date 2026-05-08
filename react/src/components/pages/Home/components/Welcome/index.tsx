import { CookieTypes, useCookies } from '@cf/context/cookieContext'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/Utility.class'
import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import React, { useEffect, useState } from 'react'

import * as SC from './style'
import { WorkflowType } from '../../../Workflow/types'

type PropsType = {
  hide?: boolean
}

const Welcome = ({ hide }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { dispatch } = useDialog()
  const [visible, setVisible] = useState(true)
  const { cookies, updateCookie, removeCookie } = useCookies()

  useEffect(() => {
    const showWelcomeMessageCookie =
      !cookies[CookieTypes.HIDE_HOME_WELCOME_MESSAGE]

    setVisible(showWelcomeMessageCookie)
  }, [cookies])

  if (hide || !visible) {
    return null
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function handleClose() {
    setVisible(false)
    updateCookie(CookieTypes.HIDE_HOME_WELCOME_MESSAGE, String(true), {
      expires: 7
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <SC.Wrap>
      <SC.CloseButton aria-label="close" onClick={handleClose}>
        <CloseIcon />
      </SC.CloseButton>

      <Typography variant="h4">{_t('Welcome to CourseFlow')}</Typography>

      <Typography sx={{ mt: 2 }}>
        {_t(
          'Tell us a bit more about your goals so that we can help you get started.'
        )}
      </Typography>

      <SC.Actions>
        <Button
          variant="contained"
          onClick={() =>
            dispatch(DialogMode.WORKFLOW_CREATE, {
              workflowType: WorkflowType.PROGRAM
            })
          }
        >
          {_t('I want to create a program')}
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            dispatch(DialogMode.WORKFLOW_CREATE, {
              workflowType: WorkflowType.COURSE
            })
          }
        >
          {_t('I want to create a course')}
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            dispatch(DialogMode.WORKFLOW_CREATE, {
              workflowType: WorkflowType.ACTIVITY
            })
          }
        >
          {_t('I want to create an activity')}
        </Button>
      </SC.Actions>
    </SC.Wrap>
  )
}

export default Welcome
