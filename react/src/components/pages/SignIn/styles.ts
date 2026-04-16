import Box from '@mui/material/Box'
import MuiPaper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'

export const Page = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%'
}))

export const Paper = styled(MuiPaper)(({ theme }) => ({
  width: '100%',
  maxWidth: '400px',
  padding: theme.spacing(3)
}))

export const Form = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  gap: theme.spacing(3),
  '& > *': {
    flexGrow: 1
  },
  '& .MuiButton-root': {
    fontSize: '16px',
    fontWeight: 600
  }
}))

export const LogoWrap = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: theme.spacing(4),
  paddingLeft: 16,
  paddingRight: 16,
  paddingBottom: theme.spacing(3),
  '& > svg': {
    width: '60px',
    height: '60px',
    marginRight: theme.spacing(2)
  },
  '& .MuiTypography-root': {
    fontSize: '24px'
  }
}))
