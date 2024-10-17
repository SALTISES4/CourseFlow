import Box from '@mui/material/Box'
import { blueGrey, grey, yellow } from '@mui/material/colors'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'

export const Wrap = styled(Box, {
  shouldForwardProp: (prop) => !['group', 'highlight'].includes(prop as string)
})<{ group?: string; highlight?: boolean }>(({ theme, group, highlight }) => ({
  display: 'flex',
  flexDirection: 'row',
  borderRadius: `${theme.shape.borderRadius}px`,
  borderLeft: `${theme.spacing(1)} solid ${
    theme.palette.workspaceBlocks.reusableBlocks
  }`,
  backgroundColor: theme.palette.workspaceBlocks.background,
  '&:hover': {
    boxShadow: `0 0 0 1px ${blueGrey[100]}`,
    cursor: 'grab'
  },
  ...(highlight && {
    '&, &:hover': {
      boxShadow: `0 0 0 2px ${yellow[800]}`
    }
  }),
  ...(group === 'node' && {
    '&:nth-of-type(1)': {
      borderLeftColor: theme.palette.workspaceBlocks.activityOOCInstr
    },
    '&:nth-of-type(2)': {
      borderLeftColor: theme.palette.workspaceBlocks.activityOOCStud
    },
    '&:nth-of-type(3)': {
      borderLeftColor: theme.palette.workspaceBlocks.activityICInstr
    },
    '&:nth-of-type(4)': {
      borderLeftColor: theme.palette.workspaceBlocks.activityICStud
    },
    '&:nth-of-type(5)': {
      border: '1px dashed',
      paddingLeft: theme.spacing(2),
      backgroundColor: 'transparent'
    }
  }),
  ...(group === 'reusable' && {
    borderLeftColor: theme.palette.workspaceBlocks.reusableBlocks
  }),
  ...(group === 'strategies' && {
    borderLeftColor: theme.palette.workspaceBlocks.strategies
  })
}))

export const DragWrap = styled('div')(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(1),
  flexGrow: 1,
  minWidth: 0,
  '& .MuiTypography-root': {
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}))

export const DragHandle = styled('div')(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%'
}))

export const DraggableBlockToggle = styled(IconButton)(({ theme }) => ({
  marginLeft: 'auto',
  border: 0,
  padding: `0 ${theme.spacing(1)}`,
  borderLeft: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  background: 'transparent',
  flexShrink: 0,
  transition: 'color 0.15s ease',
  cursor: 'pointer',
  color: theme.palette.primary.main,
  '&:hover': {
    background: 'transparent',
    color: theme.palette.primary.dark
  }
}))

export const Placeholder = styled(Wrap)(({ theme }) => ({
  minWidth: 0,
  padding: theme.spacing(1),
  opacity: 0.7,
  backgroundColor: grey[300],
  borderLeftColor: grey[400],
  '& .MuiTypography-root': {
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}))
