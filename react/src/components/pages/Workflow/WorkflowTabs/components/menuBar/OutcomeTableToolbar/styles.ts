import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

export const ToolbarWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignSelf: 'center',
  gap: theme.spacing(2),
  marginRight: theme.spacing(2)
}))

export const ViewTypeWrapper = styled(Box)(({ theme }) => ({}))

export const ViewTypeButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: 'flex',
  '& .MuiToggleButton-root': {
    padding: '4px 8px',
    textTransform: 'none',
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    fontWeight: 600
  },
  '& .Mui-selected.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.primary.main
    }
  }
}))
