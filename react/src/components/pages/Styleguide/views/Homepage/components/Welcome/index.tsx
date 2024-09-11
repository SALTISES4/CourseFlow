import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import * as SC from './style'

type PropsType = {
  hide?: boolean
}

const Welcome = ({ hide }: PropsType) => {
  const { dispatch } = useDialog()
  const [visible, setVisible] = useState(true)

  function handleClose() {
    setVisible(!visible)
  }

  if (hide || !visible) {
    return null
  }

  return (
    <SC.Wrap>
      <SC.CloseButton aria-label="close" onClick={handleClose}>
        <CloseIcon />
      </SC.CloseButton>

      <Typography variant="h4">{'Welcome to CourseFlow'}</Typography>

      <Typography sx={{ mt: 2 }}>
        Tell us a bit more about your goals so that we can help you get started.
      </Typography>

      <SC.Actions>
        <Button
          variant="contained"
          onClick={() => dispatch(DIALOG_TYPE.PROGRAM_CREATE)}
        >
          I want to create a program
        </Button>

        <Button
          variant="contained"
          onClick={() => dispatch(DIALOG_TYPE.COURSE_CREATE)}
        >
          I want to create a course
        </Button>

        <Button
          variant="contained"
          onClick={() => dispatch(DIALOG_TYPE.ACTIVITY_CREATE)}
        >
          I want to create an activity
        </Button>
      </SC.Actions>
    </SC.Wrap>
  )
}

export default Welcome
