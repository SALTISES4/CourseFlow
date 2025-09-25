import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const Column = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'border'
})<{ border: string }>(({ theme, border }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  border
}))

export const Border = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'color'
})<{ color?: string }>(({ theme, color }) => ({
  height: '10px',
  backgroundColor: color,
  borderRadius: theme.shape.borderRadius
}))

export const Title = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  '& span': {
    display: 'block',
    minWidth: 0,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  }
}))
