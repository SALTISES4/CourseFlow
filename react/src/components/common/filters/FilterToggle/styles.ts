import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'

export const StyledButton = styled(Button)(({ theme }) => ({
  '&.filter-favorite .MuiSvgIcon-root': {
    color: 'rgb(251, 192, 45)'
  }
}))
