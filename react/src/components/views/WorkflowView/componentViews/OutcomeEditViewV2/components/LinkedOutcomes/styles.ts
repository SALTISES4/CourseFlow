import MuiBadge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import MuiPopover from '@mui/material/Popover'
import { styled } from '@mui/material/styles'

export const Wrap = styled(Box, {
  shouldForwardProp: (prop) => !['type'].includes(prop as string)
})<{ type: 'outcome' | 'node' }>(({ theme, type }) => ({
  position: 'absolute',
  top: '18px',
  right: type === 'outcome' ? 0 : '-1.5em',
  width: '20px',
  height: '20px',
  transform: 'translateY(-50%)'
}))

export const Popover = styled(MuiPopover)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginLeft: '-8px',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: `0 0 0 2px rgba(4, 186, 116, 0.5)`
  }
}))

export const Badge = styled(MuiBadge)(({ theme }) => ({
  top: '-5px',
  left: '10px',
  '& .MuiBadge-badge': {
    backgroundColor: 'rgb(253, 216, 53)'
  }
}))
