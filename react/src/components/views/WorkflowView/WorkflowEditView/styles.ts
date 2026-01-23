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
