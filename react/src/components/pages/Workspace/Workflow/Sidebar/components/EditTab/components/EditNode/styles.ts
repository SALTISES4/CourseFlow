import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'

export const LinkedWorkflowTooltip = styled(Stack)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  gap: theme.spacing(1),
  '& .MuiChip-root': {
    width: '100%',
    justifyContent: 'space-between'
  },
  '& .MuiFormControlLabel-root': {
    marginRight: 0,
    paddingLeft: '0.5em'
  },
  '& .MuiFormControlLabel-label': {
    fontSize: '14px'
  }
}))
