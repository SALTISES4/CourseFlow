import { styled } from '@mui/material/styles'

export const Wrap = styled('svg', {
  shouldForwardProp: (prop) => !['radius'].includes(prop as string)
})<{ radius: number }>(({ theme, radius }) => ({
  position: 'absolute',
  top: `${radius * -1}px`,
  left: `${radius * -1}px`,
  right: `${radius * -1}px`,
  bottom: `${radius * -1}px`,
  width: `calc(100% + ${radius * 2}px)`,
  height: `calc(100% + ${radius * 2}px)`,
  pointerEvents: 'none'
}))

export const Handle = styled('circle')(({ theme }) => ({
  position: 'relative',
  fill: '#fff',
  stroke: theme.palette.workflow.selected,
  strokeWidth: '2px'
}))
