import { WorkflowTypeIn } from '@cf/api/gen'
import { CookieTypes, useCookies } from '@cf/context/cookieContext'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import * as SC from './style'

type PropsType = {
  hide?: boolean
}

const Welcome = ({ hide }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { dispatch } = useDialog()
  const { t } = useTranslation('home')
  const [visible, setVisible] = useState(true)
  const { cookies, updateCookie } = useCookies()

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
      <SC.CloseButton aria-label={t('welcome.closeLabel')} onClick={handleClose}>
        <CloseIcon />
      </SC.CloseButton>

      <Typography variant="h4">{t('welcome.title')}</Typography>

      <Typography sx={{ mt: 2 }}>
        {t('welcome.prompt')}
      </Typography>

      <SC.Actions>
        <Button
          variant="contained"
          onClick={() =>
            dispatch(DialogMode.WORKFLOW_CREATE, {
              workflowType: WorkflowTypeIn.ACTIVITY
            })
          }
        >
          {t('welcome.createActivity')}
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            dispatch(DialogMode.WORKFLOW_CREATE, {
              workflowType: WorkflowTypeIn.COURSE
            })
          }
        >
          {t('welcome.createCourse')}
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            dispatch(DialogMode.WORKFLOW_CREATE, {
              workflowType: WorkflowTypeIn.PROGRAM
            })
          }
        >
          {t('welcome.createProgram')}
        </Button>
      </SC.Actions>
    </SC.Wrap>
  )
}

export default Welcome
