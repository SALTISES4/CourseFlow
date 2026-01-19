import { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { OuterContentWrap } from '@cf/mui/helper'
import Box from '@mui/material/Box'
import { alpha, styled } from '@mui/material/styles'

const COLUMN_WIDTH = 180

export const WorkflowEditViewWrap = styled(OuterContentWrap, {
  shouldForwardProp: (prop) => prop !== 'dragging'
})<{ dragging: boolean }>(({ theme, dragging }) => ({
  '& [draggable]': {
    pointerEvents: 'auto'
  },
  ...(dragging && {
    '[data-drop-target-for-element]': {
      pointerEvents: 'auto'
    }
  })
}))

export const WeeksWrapper = styled(Box)(() => ({
  position: 'relative'
}))

export const CellRow = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  padding: theme.spacing(2),
  gap: theme.spacing(3)
}))

export const WeekRowIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'edge'
})<{ edge: Edge | null }>(({ theme, edge }) => ({
  position: 'absolute',
  width: '100%',
  height: '16px',
  left: 0,
  top: edge === 'top' ? -16 : 'initial',
  bottom: edge === 'bottom' ? -16 : 'initial',
  opacity: edge ? 1 : 0,
  backgroundColor: alpha(theme.palette.secondary.light, 0.5)
}))

export const Cell = styled(Box)({
  position: 'relative',
  width: `${COLUMN_WIDTH}px`,
  minHeight: '50px',
  flexShrink: 0
})

export const CellInner = styled(Box, {
  shouldForwardProp: (prop) =>
    !['dragging', 'dropHighlight', 'selected'].includes(prop as string)
})<{ dragging: boolean; dropHighlight: boolean; selected: boolean }>(
  ({ theme, dragging, dropHighlight, selected }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.15s ease',
    ...(dragging && {
      opacity: 0.6
    }),
    ...(dropHighlight && {
      '&': {
        position: 'relative',
        transition: 'none',
        boxShadow: `0 0 0 2px ${theme.palette.workflow.selected}`,
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
        boxShadow: `0 0 0 2px ${theme.palette.workflow.selected}`
      }
    })
  })
)
