import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import { alpha, styled } from '@mui/material/styles'

export const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'menuActive'
})<{ menuActive: boolean }>(({ theme, menuActive }) => ({
  ...(menuActive && {
    backgroundColor: alpha(theme.palette.primary.main, 0.04)
  })
}))

export const StyledMenu = styled(Menu)(({ theme }) => ({
  marginTop: theme.spacing(1),
  '& .MuiPaper-root': {
    minWidth: '200px'
  }
}))
