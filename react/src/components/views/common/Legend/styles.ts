import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'

export const LegendWrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'show'
})<{ show: boolean }>(({ theme, show }) => ({
  display: show ? 'block' : 'none',
  position: 'fixed',
  right: 0,
  top: 0,
  background: theme.palette.common.white,
  zIndex: 5,
  padding: '20px',
  border: `2px solid ${theme.palette.primary.main}`,
  boxShadow: '0px 2px 2px 0px rgba(0, 0, 0, 0.3)'
}))

export const LegendCloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    marginRight: '0 !important' // yuck
  }
}))
