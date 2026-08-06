import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const InfoBlock = styled(Box)({})

export const InfoBlockTitle = styled(Typography)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontWeight: 600,
  fontSize: 20
}))

export const InfoBlockContent = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1)
}))

export const PermissionGrid = styled(List)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(2)
}))

export const PermissionThumbnail = styled(ListItem, {
  shouldForwardProp: (prop) => !['addNew'].includes(prop as string)
})<{ addNew?: boolean }>(({ theme, addNew }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  ...(addNew && {
    border: `1px dashed ${theme.palette.primary.main}`,
    color: theme.palette.text.primary,
    '& .MuiAvatar-root': {
      backgroundColor: theme.palette.primary.main
    }
  })
}))
