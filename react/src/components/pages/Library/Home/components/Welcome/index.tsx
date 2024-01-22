import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles'
import {
  CreateActionType,
  openCreateActionModal
} from '@cfModule/components/common/layout/TopBar'

const Wrap = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: `${theme.spacing(6)} ${theme.spacing(4)}`,
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center'
}))

const Actions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3)
}))

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  color: theme.palette.primary.main
}))

type PropsType = {
  hide?: boolean
}

const Welcome = ({ hide }: PropsType) => {
  const [visible, setVisible] = useState(true)

  function handleClose() {
    setVisible(!visible)
  }

  function handleCreateClick(resourceType: CreateActionType) {
    openCreateActionModal(resourceType)
  }

  if (hide || !visible) {
    return null
  }

  return (
    <Wrap>
      <CloseButton aria-label="close" onClick={handleClose}>
        <CloseIcon />
      </CloseButton>
      <Typography variant="h4">
        {window.gettext('Welcome to CourseFlow')}
      </Typography>
      <Typography sx={{ mt: 2 }}>
        {window.gettext(
          'Tell us a bit more about your goals so that we can help you get started.'
        )}
      </Typography>
      <Actions>
        <Button
          variant="contained"
          onClick={() => handleCreateClick('program')}
        >
          {window.gettext('I want to create a program')}
        </Button>
        <Button variant="contained" onClick={() => handleCreateClick('course')}>
          {window.gettext('I want to create a course')}
        </Button>
        <Button
          variant="contained"
          onClick={() => handleCreateClick('activity')}
        >
          {window.gettext('I want to create an activity')}
        </Button>
      </Actions>
    </Wrap>
  )
}

export default Welcome