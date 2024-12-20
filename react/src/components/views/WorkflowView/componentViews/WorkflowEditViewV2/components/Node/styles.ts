import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

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
  },
  '&:hover': {
    cursor: 'grab',
    '&::after': {
      borderRadius: 0,
      transform: 'translateY(100%)'
    }
  },
  '[aria-pressed=true] &': {
    cursor: 'grabbing',
    '&::after': {
      borderRadius: 0,
      transform: 'translateY(100%)'
    }
  }
}))

export const Content = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.common.white
}))

export const Title = styled(Typography)(({ theme }) => ({
  margin: 0,
  fontWeight: 600
}))

export const Subtitle = styled(Typography)(({ theme }) => ({
  display: '-webkit-box',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  lineClamp: '4',
  WebkitLineClamp: '4',
  WebkitBoxOrient: 'vertical',
  margin: `${theme.spacing(1)} 0 0`
}))
