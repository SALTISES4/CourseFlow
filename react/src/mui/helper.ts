import Box, { BoxProps as MuiBoxProps } from '@mui/material/Box'
import { styled } from '@mui/material/styles'

interface BoxProps extends MuiBoxProps {
  narrow?: boolean
}

export const OuterContentWrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'narrow'
})<BoxProps>(({ theme, narrow }) => ({
  padding: theme.spacing(8),
  paddingTop: 0,
  ...(narrow && {
    maxWidth: '34.25rem', // This can be adjusted as per your design requirement
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  })
}))

export const GridWrap = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 50%)',
  gap: theme.spacing(3)
}))
