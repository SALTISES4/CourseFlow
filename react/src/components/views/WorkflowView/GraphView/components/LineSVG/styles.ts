import { styled } from '@mui/material/styles'

export const EdgeLayer = styled('div')(() => ({
  display: 'contents'
}))

export const BottomSVG = styled('svg')(() => ({
  position: 'absolute',
  top: '-30px',
  left: '-30px',
  width: 'calc(100% + 60px)',
  height: 'calc(100% + 60px)',
  pointerEvents: 'none',
  zIndex: 2
}))

export const TopSVG = styled(BottomSVG)(() => ({
  zIndex: 5
}))
