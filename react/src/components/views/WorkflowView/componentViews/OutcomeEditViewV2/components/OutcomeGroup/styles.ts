import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { blueGrey } from '@mui/material/colors'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const OutcomeGroupWrap = styled(Box)(({ theme }) => ({
  '&:not(:first-of-type)': {
    marginTop: theme.spacing(3)
  }
}))

export const OutcomeGroupTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1)
}))

export const OutcomeGroup = styled('ul')(({ theme }) => ({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  counterReset: 'index',
  '& ul': {
    marginLeft: theme.spacing(1)
  },
  '& li': {
    marginTop: theme.spacing(1)
  },
  '& li .MuiTypography-root::before': {
    counterIncrement: 'index',
    content: `counters(index, '.', decimal) ' - '`
  },
  '& .MuiBox-root > .MuiBox-root': {
    border: 0,
    backgroundColor: 'rgb(229, 233, 244)' // NOTE: Figma says grey[100] but it's not
  },
  '& ul .MuiBox-root > .MuiBox-root': {
    backgroundColor: 'rgb(245, 249, 255)' // NOTE: Figma says grey[50] but it's not
  },
  '& ul ul .MuiBox-root > .MuiBox-root': {
    border: '1px solid',
    borderColor: 'rgb(238, 242, 253)',
    backgroundColor: 'transparent'
  }
}))

export const OutcomeHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected: boolean }>(({ theme, selected }) => ({
  position: 'relative',
  display: 'flex',
  borderRadius: `${theme.shape.borderRadius}px`,
  flexDirection: 'row',
  flexGrow: 1,
  minWidth: 0,
  '&:hover': {
    boxShadow: `0 0 0 1px ${blueGrey[100]}`,
    cursor: 'grab'
  },
  ...(selected && {
    '&, &:hover': {
      boxShadow: `0 0 0 2px rgba(4, 186, 116, 0.5)`
    }
  })
}))

export const OutcomeHeaderToggle = styled(IconButton)(({ theme }) => ({
  marginLeft: 'auto',
  border: 0,
  padding: `0 ${theme.spacing(1)}`,
  borderLeft: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  background: 'transparent',
  flexShrink: 0,
  transition: 'color 0.15s ease',
  cursor: 'pointer',
  color: theme.palette.primary.main,
  '&:hover': {
    background: 'transparent',
    color: theme.palette.primary.dark
  }
}))

export const OutcomeTitle = styled(Typography)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(1),
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}))

export const AddNewButton = styled(Button)(({ theme }) => ({
  display: 'block',
  width: '100%',
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  border: '1px dashed rgb(178, 182, 192)',
  textAlign: 'left',
  color: 'currentcolor',
  fontWeight: 'normal',
  lineHeight: 1.3
}))
