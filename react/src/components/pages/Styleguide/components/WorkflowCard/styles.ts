import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import { alpha, styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const CardWrap = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  gap: theme.spacing(1),
  borderRadius: '0.3em',
  flexDirection: 'column',
  transition: 'background-color 0.3s ease',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: alpha(theme.palette.action.hover, 0.04)
  },
  '&.selected': {
    borderColor: theme.palette.primary.main
  }
}))

export const CardHeader = styled('header')({})

export const CardFooter = styled('footer')(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(3),
  alignItems: 'flex-start'
}))

export const CardFooterTags = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: `0 ${theme.spacing(1)}`
}))

export const CardFooterActions = styled('div')(({ theme }) => ({
  marginLeft: 'auto',
  paddingLeft: theme.spacing(2)
}))

export const CardTitle = styled(Typography)({
  marginBottom: 0,
  minWidth: 0,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  fontWeight: 600,
  '& *': {
    textOverflow: 'inherit',
    overflow: 'inherit',
    whiteSpace: 'inherit'
  },
  '& a': {
    textDecoration: 'none',
    color: 'currentColor'
  }
})

CardTitle.defaultProps = {
  variant: 'h6'
}

export const CardCaption = styled(Typography)({})

CardCaption.defaultProps = {
  variant: 'caption'
}

export const CardChip = styled(Chip)(({ theme }) => ({
  '&.project': {
    backgroundColor: theme.palette.courseflow.project,
    color: theme.palette.common.white
  },
  '&.program': {
    backgroundColor: theme.palette.courseflow.program,
    color: theme.palette.common.white
  },
  '&.activity': {
    backgroundColor: theme.palette.courseflow.activity,
    color: theme.palette.common.white
  },
  '&.course': {
    backgroundColor: theme.palette.courseflow.course,
    color: theme.palette.common.white
  },
  '&.template': {
    backgroundColor: 'transparent',
    color: theme.palette.courseflow.template,
    border: '1px solid currentColor'
  }
}))

CardChip.defaultProps = {
  size: 'small',
  variant: 'filled'
}

export const CardFavoriteBtn = styled(IconButton)({
  marginTop: '-12px',
  marginBottom: '-8px',
  marginRight: '-8px'
})
