import { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

export const CellHighlight = styled(Box, {
  shouldForwardProp: (prop) => !['color'].includes(prop as string)
})<{ color: string }>(({ theme, color }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: color,
  borderRadius: theme.shape.borderRadius
}))

export const CellLine = styled(Box, {
  shouldForwardProp: (prop) => !['edge', 'offset'].includes(prop as string)
})<{ edge: Edge; offset?: number }>(({ theme, edge, offset }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: edge === 'top' && (offset ?? '-19px'),
    bottom: edge === 'bottom' && (offset ?? '-19px'),
    left: 0,
    width: '100%',
    height: '6px',
    borderRadius: '0.3em',
    backgroundColor: theme.palette.workflow.selected
  }
}))
