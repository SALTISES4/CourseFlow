import Box, { BoxProps } from '@mui/material/Box'
import { Theme, styled } from '@mui/material/styles'

export const OuterContentWrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'narrow'
})(({ theme, narrow }: BoxProps & { theme: Theme; narrow?: boolean }) => ({
  padding: theme.spacing(8),
  paddingTop: 0,
  ...(narrow && {
    maxWidth: '34.25rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  })
}))
