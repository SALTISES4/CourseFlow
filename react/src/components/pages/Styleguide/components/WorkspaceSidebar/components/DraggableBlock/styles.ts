import Box from '@mui/material/Box'
import { blueGrey, yellow } from '@mui/material/colors'
import { styled } from '@mui/material/styles'

export const Wrap = styled(Box, {
  shouldForwardProp: (prop) => !['group', 'highlight'].includes(prop as string)
})<{ group?: string; highlight?: boolean }>(({ theme, group, highlight }) => ({
  position: 'relative',
  padding: theme.spacing(1),
  borderRadius: `${theme.shape.borderRadius}px`,
  borderLeft: `${theme.spacing(1)} solid ${
    theme.palette.workspaceBlocks.reusableBlocks
  }`,
  backgroundColor: theme.palette.workspaceBlocks.background,
  '& .MuiTypography-root': {
    margin: 0
  },
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

export const DragHandle = styled('div')(() => ({}))
