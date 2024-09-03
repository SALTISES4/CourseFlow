import { styled } from '@mui/material/styles'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

export const StyledMenu = styled(Menu)(({ theme }) => ({
  marginTop: theme.spacing(1),
  '& .MuiPaper-root': {
    minWidth: '200px'
  }
}))

export const StyledMenuItem = styled(MenuItem)({
  '& .MuiSvgIcon-root': {
    marginLeft: 'auto',
    flexShrink: 0,
    fontSize: '1em'
  }
})
