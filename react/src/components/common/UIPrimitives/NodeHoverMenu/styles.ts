import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

export const Wrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'show'
})<{ show: boolean }>(({ theme, show }) => ({
  position: 'absolute',
  top: 2,
  right: 2,
  padding: '2px',
  background: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius,
  boxShadow: `0 2px 1px -1px rgba(0, 0, 0, 0.16), 0 1px 1px 0 rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.08)`,
  zIndex: 5,
  opacity: 0,
  visibility: 'hidden',
  transition: 'all 0.15s ease',
  ...(show && {
    opacity: 1,
    visibility: 'visible'
  }),
  '& .MuiButtonBase-root': {
    marginLeft: '-2px',
    marginRight: '-2px'
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1em'
  }
}))
