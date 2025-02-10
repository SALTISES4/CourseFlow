import { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import Box from '@mui/material/Box'
import { alpha, styled } from '@mui/material/styles'

const COLUMN_WIDTH = 180

export const CellRow = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  padding: theme.spacing(2),
  gap: theme.spacing(3)
}))

export const CellRowIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'edge'
})<{ edge: Edge | null }>(({ theme, edge }) => ({
  position: 'absolute',
  top: edge === 'top' ? -1 : 'initial',
  bottom: edge === 'bottom' ? -1 : 'initial',
  left: 0,
  height: '2px',
  width: '100%',
  opacity: edge ? 1 : 0,
  backgroundColor: alpha(theme.palette.secondary.light, 0.5)
}))

export const WeekRowIndicator = styled(CellRowIndicator, {
  shouldForwardProp: (prop) => prop !== 'edge'
})<{ edge: Edge | null }>(({ theme, edge }) => ({
  height: '16px',
  top: edge === 'top' ? -16 : 'initial',
  bottom: edge === 'bottom' ? -16 : 'initial'
}))

export const Cell = styled(Box)({
  position: 'relative',
  width: `${COLUMN_WIDTH}px`,
  flexShrink: 0
})

export const CellInner = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'dragging'
})<{ dragging: boolean }>(({ theme, dragging }) => ({
  transition: 'all 0.3s ease',
  ...(dragging && {
    opacity: 0.6,
    transform: 'scale(0.8)'
  })
}))
