import { styled } from '@mui/material/styles'

export const Wrap = styled('svg', {
  shouldForwardProp: (prop) => !['radius', 'offset'].includes(prop as string)
})<{ radius: number; offset: number }>(({ theme, radius, offset }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: `calc(100% + ${radius * 2 + offset * 2}px)`,
  height: `calc(100% + ${radius * 2 + offset * 2}px)`,
  transform: 'translate(-50%, -50%)',
  zIndex: 10,
  pointerEvents: 'none'
}))

export const Handle = styled('circle')(({ theme }) => ({
  position: 'relative',
  fill: '#fff',
  stroke: theme.palette.workflow.selected,
  strokeWidth: '2px',
  pointerEvents: 'auto'
}))
