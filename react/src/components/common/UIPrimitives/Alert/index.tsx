import CampaignIcon from '@mui/icons-material/Campaign'
import Alert, { AlertProps } from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import { SxProps, styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Cookies from 'js-cookie'
import { ReactNode, useState } from 'react'

type PropsType = {
  severity?: AlertProps['severity'] | 'update'
  title?: ReactNode
  subtitle?: ReactNode
  persistent?: boolean
  hideIfCookie?: string
  onClose?: () => void
  sx?: SxProps
}

const StyledTitle = styled(AlertTitle)({
  fontWeight: 600,
  '&:last-child': {
    marginBottom: 0
  }
})

const StyledSubtitle = styled(Typography)({})

/**
 * Custom Alert wrapper for the MUI Alert component
 * that is persistent unless provided with 'hideIfCookie' prop
 * which internally checks if the cookie exists and determines
 * whether to display or hide the component.
 */
const CFAlert = ({
  severity = 'info',
  title,
  subtitle,
  persistent,
  onClose,
  hideIfCookie,
  sx
}: PropsType) => {
  const [hide, setHide] = useState(
    hideIfCookie ? !!Cookies.get(hideIfCookie) : false
  )

  function handleClose() {
    onClose && onClose()
    hideIfCookie && Cookies.set(hideIfCookie, 'true', { expires: 7 }) // expires?
    setHide(true)
  }

  if (hide) {
    return null
  }

  const isUpdateAnnouncement = severity === 'update'

  return (
    <Alert
      severity={isUpdateAnnouncement ? 'info' : severity}
      icon={isUpdateAnnouncement ? <CampaignIcon /> : null}
      sx={sx}
      onClose={
        persistent
          ? undefined
          : () => {
              hideIfCookie && handleClose()
            }
      }
    >
      {title && <StyledTitle>{title}</StyledTitle>}
      {subtitle && <StyledSubtitle variant="body2">{subtitle}</StyledSubtitle>}
    </Alert>
  )
}

export default CFAlert
