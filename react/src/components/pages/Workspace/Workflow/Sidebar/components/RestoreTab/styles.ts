import { styled } from '@mui/material'

import { Wrap } from '../../Draggable/Block/styles'

export const StyledRestorableBlock = styled(Wrap, {
  shouldForwardProp: (prop) => !['selected'].includes(prop as string)
})<{ selected?: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(1),
  borderLeftWidth: 0,
  backgroundColor: theme.palette.workspaceBlocks.background,
  '&, &:hover': {
    cursor: 'pointer'
  },
  ...(selected && {
    boxShadow: '0 0 0 1px rgba(4, 186, 116, 0.5)',
    '&:hover': {
      boxShadow: '0 0 0 1px rgba(4, 186, 116, 0.5)'
    }
  })
}))
