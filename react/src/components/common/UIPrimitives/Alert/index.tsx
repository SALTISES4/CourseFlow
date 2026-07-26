import CampaignIcon from '@mui/icons-material/Campaign'
import Alert, { AlertProps } from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import { SxProps, styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Cookies from 'js-cookie'
import { ReactNode, useCallback, useState } from 'react'

type PropsType = {
  severity?: AlertProps['severity'] | 'update'
  icon?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  cta?: ReactNode
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
  icon = null,
  title,
  subtitle,
  cta,
  persistent,
  onClose,
  hideIfCookie,
  sx
}: PropsType) => {
  const [hide, setHide] = useState(
    hideIfCookie ? !!Cookies.get(hideIfCookie) : false
  )

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    }

    if (hideIfCookie) {
      Cookies.set(hideIfCookie, 'true', { expires: 7 }) // expires?
    }

    setHide(true)
  }, [hideIfCookie, onClose])

  if (hide) {
    return null
  }

  const isUpdateAnnouncement = severity === 'update'

  return (
    <Alert
      severity={isUpdateAnnouncement ? 'info' : severity}
      icon={isUpdateAnnouncement ? <CampaignIcon /> : icon}
      sx={sx}
      onClose={persistent ? undefined : handleClose}
      slots={{ closeButton: cta ? () => cta : undefined }}
    >
      {title && <StyledTitle>{title}</StyledTitle>}
      {subtitle && <StyledSubtitle variant="body2">{subtitle}</StyledSubtitle>}
    </Alert>
  )
}

export default CFAlert
