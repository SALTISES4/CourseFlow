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
  minHeight: '50px',
  flexShrink: 0
})

export const CellInner = styled(Box, {
  shouldForwardProp: (prop) =>
    !['dragShrink', 'dropHighlight', 'selected'].includes(prop as string)
})<{ dragShrink: boolean; dropHighlight: boolean; selected: boolean }>(
  ({ theme, dragShrink, dropHighlight, selected }) => ({
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.3s ease',
    ...(dragShrink && {
      opacity: 0.6,
      transform: 'scale(0.8)'
    }),
    ...(dropHighlight && {
      '&': {
        position: 'relative',
        transition: 'none',
        boxShadow: `0 0 0 2px rgba(4, 186, 116, 0.5)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(4, 186, 116, 0.1)'
        }
      }
    }),
    ...(selected && {
      '&, &:hover': {
        boxShadow: `0 0 0 2px rgba(4, 186, 116, 0.5)`
      }
    })
  })
)
