import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const DraggingWeekWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  alignItems: 'center',
  gap: theme.spacing(2),
  '&:hover': {
    cursor: 'grab'
  },
  '[aria-pressed=true] &': {
    cursor: 'grabbing'
  },
  '& > div': {
    margin: 0,
    flexGrow: 1
  }
}))

export const WeekWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: 'rgb(238, 242, 253)',
  borderRadius: theme.shape.borderRadius
}))

export const WeekHeader = styled('header', {
  shouldForwardProp: (prop) => prop !== 'expanded'
})<{ expanded: boolean }>(({ theme, expanded }) => ({
  display: 'flex',
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid transparent',
  ...(expanded && {
    borderBottomColor: theme.palette.divider,
    '.MuiIconButton-root': {
      transform: 'rotateZ(-180deg)'
    }
  }),
  '& .MuiIconButton-root': {
    transition: 'transform 0.2s ease'
  }
}))

export const WeekTitle = styled(Typography)(() => ({
  fontWeight: 600
}))

export const EmptyText = styled(Typography)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2)
}))
