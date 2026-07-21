import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const ColumnWrap = styled(Box, {
  shouldForwardProp: (prop) => !['dragging'].includes(prop as string)
})<{ dragging: boolean }>(({ theme, dragging }) => ({
  position: 'relative',
  transition: 'all 0.15s ease',
  cursor: 'pointer',
  ...(dragging && {
    '&': {
      opacity: 0.4
    }
  })
}))

export const Inner = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'border'
})<{ border?: string }>(({ theme, border }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  ...(border ? { border } : {})
}))

export const Border = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'color'
})<{ color?: string }>(({ theme, color }) => ({
  height: '10px',
  backgroundColor: color,
  borderRadius: theme.shape.borderRadius
}))

export const Background = styled(Box, {
  shouldForwardProp: (prop) =>
    !['hovering', 'selected', 'draggingOver'].includes(prop as string)
})<{ hovering: boolean; selected: boolean }>(
  ({ theme, hovering, selected }) => ({
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    right: '-8px',
    bottom: '-8px',
    pointerEvents: 'none',
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.15s ease',
    ...(hovering && {
      boxShadow: `0 0 0 1px ${theme.palette.workflow.selected}`
    }),
    ...(selected && {
      boxShadow: `0 0 0 2px ${theme.palette.workflow.selected}`
    })
  })
)

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
