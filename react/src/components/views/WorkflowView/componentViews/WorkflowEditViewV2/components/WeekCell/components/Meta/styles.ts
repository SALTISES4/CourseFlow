import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const Wrap = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2)
}))

export const WorkflowLink = styled(Typography)({
  fontSize: '12px',
  '& .MuiTypography-root': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  '& .MuiSvgIcon-root': {
    fontSize: '16px'
  }
})

export const Footer = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(1),
  justifyContent: 'space-between',
  color: theme.palette.secondary.light,
  '& .MuiSvgIcon-root': {
    fontSize: '16px'
  }
}))

export const IconWrap = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '4px'
}))

export const Tag = styled('span')(({ theme }) => ({
  display: 'flex',
  padding: '2px',
  gap: '4px',
  fontSize: '12px',
  borderRadius: theme.shape.borderRadius,
  lineHeight: 1,
  alignItems: 'center',
  backgroundColor: 'rgba(120, 144, 156, 0.12)',
  '& span': {
    fontSize: '12px'
  }
}))
