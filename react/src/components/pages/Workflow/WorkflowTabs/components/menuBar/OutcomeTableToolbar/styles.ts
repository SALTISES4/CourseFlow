import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

export const ToolbarWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignSelf: 'center',
  gap: theme.spacing(2),
  marginRight: theme.spacing(2)
}))
