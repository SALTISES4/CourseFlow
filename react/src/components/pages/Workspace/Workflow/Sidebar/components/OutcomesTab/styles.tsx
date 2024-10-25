import { styled } from '@mui/material'

export const StyledOutcomes = styled('ul')(({ theme }) => ({
  counterReset: 'index',
  '& li .MuiTypography-root::before': {
    counterIncrement: 'index',
    content: `counters(index, '.', decimal) ' - '`
  },
  '& .MuiBox-root': {
    border: 0,
    backgroundColor: 'rgb(229, 233, 244)' // NOTE: Figma says grey[100] but it's not
  },
  '& ul .MuiBox-root': {
    backgroundColor: 'rgb(245, 249, 255)' // NOTE: Figma says grey[50] but it's not
  },
  '& ul ul .MuiBox-root': {
    border: '1px solid',
    borderColor: theme.palette.divider,
    backgroundColor: 'transparent'
  }
}))
