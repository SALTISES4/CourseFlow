import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ListItem from '@mui/material/ListItem'

export const InfoBlock = styled(Box)({})

export const InfoBlockTitle = styled(Typography)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontWeight: 600
}))

export const InfoBlockContent = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1)
}))

export const PermissionThumbnail = styled(ListItem)(({ theme }) => ({
  paddingLeft: 0,
  paddingRight: 0,
  borderBottom: `1px solid ${theme.palette.divider}`
}))

export const ObjectSetThumbnail = styled(Box)(({ theme }) => ({
  paddingTop: '12px',
  paddingBottom: '12px',
  borderBottom: `1px solid ${theme.palette.divider}`
}))
