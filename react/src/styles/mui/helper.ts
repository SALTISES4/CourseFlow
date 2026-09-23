import Box, { BoxProps as MuiBoxProps } from '@mui/material/Box'
import { styled } from '@mui/material/styles'

interface BoxProps extends MuiBoxProps {
  narrow?: boolean
  padTop?: boolean
}

export const OuterContentWrap = styled(Box, {
  shouldForwardProp: (prop) => !['narrow', 'padTop'].includes(prop as string)
})<BoxProps>(({ theme, narrow, padTop }) => ({
  padding: theme.spacing(8),
  paddingTop: padTop ? theme.spacing(4) : 0,
  ...(narrow && {
    maxWidth: '34.25rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  })
}))

export const GridWrap = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: theme.spacing(3),
  '& > *': {
    minWidth: 0
  }
}))
