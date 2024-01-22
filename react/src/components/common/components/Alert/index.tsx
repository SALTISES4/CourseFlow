import React, { ReactNode } from 'react'
import Alert, { AlertProps } from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import { styled, SxProps } from '@mui/material/styles'

type PropsType = {
  severity: AlertProps['severity']
  title: string
  subtitle?: string | ReactNode
  onClose?: () => void
  sx?: SxProps
}

const StyledTitle = styled(AlertTitle)({
  fontWeight: 600
})

const CFAlert = ({ severity, title, subtitle, sx }: PropsType) => {
  return (
    <Alert severity={severity} sx={sx}>
      <StyledTitle>{title}</StyledTitle>
      {subtitle}
    </Alert>
  )
}

export default CFAlert
