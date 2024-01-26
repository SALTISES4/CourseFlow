import theme from '@cfModule/mui/theme'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

export const CardWrap = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '0.3em',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(2)
}))

export const CardHeader = styled('header')({})

export const CardContent = styled(Box)({
  flexGrow: 1
})

export const CardFooter = styled('footer')({
  display: 'flex',
  marginTop: 'auto'
})

export const CardFooterTags = styled('footer')({
  display: 'flex',
  gap: theme.spacing(1)
})

export const CardFooterActions = styled('footer')({
  marginLeft: 'auto',
  paddingLeft: theme.spacing(2)
})

export const CardTitle = styled(Typography)({
  marginBottom: 0
})

export const CardCaption = styled(Typography)({})
export const CardDescription = styled(Typography)({})
