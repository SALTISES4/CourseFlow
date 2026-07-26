import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'
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
    borderColor: theme.palette.workflow.selected,
    '& .library-lifecycle-actions': {
      opacity: 1
    }
  },
  '&:focus-within .library-lifecycle-actions': {
    opacity: 1
  },
  '& .library-lifecycle-actions': {
    opacity: 0,
    transition: 'opacity 0.2s ease'
  },
  '&.selected': {
    borderColor: theme.palette.primary.main
  }
}))

export const CardHeader = styled('header')({
  marginBottom: 'auto'
})

export const CardFooter = styled('footer')(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(2),
  alignItems: 'center',
  flexWrap: 'wrap'
}))

export const CardFooterTags = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: `0 ${theme.spacing(1)}`
}))

export const CardFooterActions = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  marginLeft: 'auto',
  paddingLeft: theme.spacing(2)
}))

export const CardFooterInfo = styled('div')(({ theme }) => ({
  width: '100%',
  '&:not(:last-child)': {
    marginBottom: theme.spacing(1)
  },
  '&:empty': {
    display: 'none'
  }
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

export const CardCaption = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  opacity: 0.6,
  color: theme.palette.common.black
}))

export const CardChip = styled(Chip)(({ theme }) => ({
  '&.project': {
    // @todo these are undefined often, like in this comparison view
    // do not remove these optional operators until
    // 'rendermessagebox' is fixed
    backgroundColor: theme.palette.courseflow?.project ?? '',
    color: theme.palette.common.white
  },
  '&.program': {
    backgroundColor: theme.palette.courseflow?.program ?? '',
    color: theme.palette.common.white
  },
  '&.activity': {
    backgroundColor: theme.palette.courseflow?.activity ?? '',
    color: theme.palette.common.white
  },
  '&.course': {
    backgroundColor: theme.palette.courseflow?.course ?? '',
    color: theme.palette.common.white
  },
  '&.template': {
    backgroundColor: 'transparent',
    color: theme.palette.courseflow?.template ?? '',
    border: '1px solid currentColor'
  },
  '&.archived': {
    color: theme.palette.text.disabled
  },
  '&.default': {
    backgroundColor: '#ECEFF1'
  }
}))

CardChip.defaultProps = {
  size: 'small',
  variant: 'filled'
}
