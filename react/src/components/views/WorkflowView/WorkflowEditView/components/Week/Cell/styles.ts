import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const CellInner = styled(Box, {
  shouldForwardProp: (prop) =>
    !['dragging', 'dropHighlight', 'selected'].includes(prop as string)
})<{
  dragging?: boolean
  dropHighlight?: boolean
  selected?: boolean
  highlighted?: boolean
}>(({ theme, dragging, dropHighlight, selected, highlighted }) => ({
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
  }),
  ...(highlighted && {
    '&, &:hover': {
      boxShadow: `0 0 0 2px ${theme.palette.workflow.highlighted}`
    }
  })
}))

export const Border = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '10px',
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'inherit',
    borderTopLeftRadius: 'inherit',
    borderTopRightRadius: 'inherit',
    transition: 'all 0.3s ease'
  }
}))

export const Content = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.common.white,
  flexGrow: 1
}))

export const Title = styled(Typography)({
  margin: 0
})

export const Subtitle = styled(Typography)(({ theme }) => ({
  display: '-webkit-box',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  lineClamp: '4',
  WebkitLineClamp: '4',
  WebkitBoxOrient: 'vertical',
  margin: `${theme.spacing(1)} 0 0`
}))
