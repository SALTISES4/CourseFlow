import ListItemButton from '@mui/material/ListItemButton'
import { alpha, styled } from '@mui/material/styles'

export const TemplateThumbnail = styled(ListItemButton)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  transition: 'background-color 0.3s ease',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: alpha(theme.palette.action.hover, 0.04)
  }
}))
