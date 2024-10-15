import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

export const ObjectSetThumbnail = styled(Box)(({ theme }) => ({
  paddingTop: '12px',
  paddingBottom: '12px',
  borderBottom: `1px solid ${theme.palette.divider}`
}))
