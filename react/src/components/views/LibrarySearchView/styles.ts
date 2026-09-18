import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'

export const ToolbarWrap = styled(Toolbar)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4)
}))

export const StackOuter = styled(Stack)(({ theme }) => ({
  width: '100%',
  flexDirection: 'row',
  spacing: theme.spacing(2),
  justifyContent: 'space-between'
}))

export const StackInner = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  spacing: theme.spacing(2),
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  '& > *': {
    marginLeft: '0 !important'
  }
}))
