import { alpha, styled } from '@mui/material/styles'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

export const InsertModeTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

export const InsertButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(1),
  '& .MuiToggleButton-root': {
    flexGrow: 1,
    textTransform: 'none',
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    fontWeight: 600,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05)
    }
  },
  '& .Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.primary.main
    }
  }
}))
