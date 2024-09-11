import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'

export const Wrap = styled(Box)({
  '& .MuiInput-root': {
    width: '220px'
  }
})

export const StyledMenu = styled(Menu)(({ theme }) => ({
  marginTop: theme.spacing(1),
  '& .MuiPaper-root': {
    minWidth: '560px'
  }
}))

export const Suggestion = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2)
}))

export const ProjectGroup = styled('span')({
  width: '150px',
  flexShrink: 0,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap'
})

export const ProjectName = styled('span')({
  width: '250px',
  marginRight: 'auto',
  flexShrink: 0,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap'
})

export const ProjectTag = styled('span')({
  width: '80px',
  flexShrink: 0
})
