import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const DraggingSectionWrapper = styled(Box)(({ theme }) => ({
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

export const SectionWrapper = styled(Box, {
  shouldForwardProp: (prop) =>
    !['selected', 'hovering'].includes(prop as string)
})<{ selected: boolean; hovering: boolean }>(
  ({ theme, selected, hovering }) => ({
    position: 'relative',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    zIndex: 1,
    borderRadius: theme.shape.borderRadius,
    pointerEvents: 'none',
    ...(hovering && {
      '&': {
        cursor: 'pointer',
        boxShadow: `0 0 0 1px ${theme.palette.workflow.selected}`
      }
    }),
    ...(selected && {
      '&, &:hover': {
        boxShadow: `0 0 0 2px ${theme.palette.workflow.selected}`
      }
    })
  })
)

export const SectionBackground = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 0,
  width: '100%',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.workspaceBlocks.background
}))

export const SectionHeader = styled('header', {
  shouldForwardProp: (prop) =>
    !['expanded', 'dragging'].includes(prop as string)
})<{ dragging: boolean; expanded: boolean }>(
  ({ theme, expanded, dragging }) => ({
    position: 'relative',
    display: 'flex',
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid transparent',
    minHeight: 57,
    pointerEvents: 'auto',
    ...(expanded && {
      borderBottomColor: theme.palette.divider,
      '.arrow-icon': {
        transform: 'rotateZ(-180deg)'
      }
    }),
    ...(dragging && {
      '.hover-menu': {
        display: 'none'
      }
    }),
    '& .arrow-icon': {
      transition: 'transform 0.2s ease'
    }
  })
)

export const SectionTitle = styled(Typography)(() => ({
  display: 'inline-flex',
  gap: '1em',
  fontWeight: 600
}))

export const SectionNumber = styled('span')(() => ({
  display: 'inline-flex',
  width: '24px',
  height: '24px',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '50%',
  fontSize: '10px',
  backgroundColor: '#D5D9E4'
}))

export const EmptyText = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '100%',
  padding: theme.spacing(2),
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  color: theme.palette.secondary.light,
  pointerEvents: 'none'
}))
