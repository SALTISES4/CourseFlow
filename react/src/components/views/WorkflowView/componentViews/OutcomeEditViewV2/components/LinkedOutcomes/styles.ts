import MuiBadge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import MuiPopover from '@mui/material/Popover'
import { styled } from '@mui/material/styles'

export const Wrap = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '18px',
  right: 0,
  width: '20px',
  height: '20px',
  transform: 'translateY(-50%)'
}))

export const Popover = styled(MuiPopover)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginLeft: '10px',
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
