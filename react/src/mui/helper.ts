import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

export const OuterContentWrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'narrow'
})(
  (
    // @ts-ignore
    { theme, narrow } // @todo narrow is throwing type error
  ) => ({
    padding: theme.spacing(8),
    paddingTop: 0,
    ...(narrow && {
      maxWidth: '34.25rem',
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2)
    })
  })
)
