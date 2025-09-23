import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

export const Wrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  background: '#E2F5EB',
  color: theme.palette.primary.main,
  '& > .MuiBox-root': {
    padding: `${theme.spacing(0.5)} ${theme.spacing(3)}`
  }
}))

export const Inner = styled(Box)(() => ({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between'
}))
