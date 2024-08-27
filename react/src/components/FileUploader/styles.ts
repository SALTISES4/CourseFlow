import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const Wrap = styled('div')(() => ({
  marginTop: '1.25em'
}))

export const TextWrap = styled('div')(({ theme }) => ({
  padding: '2.7em 1em',
  border: `1px dashed ${theme.palette.divider}`,
  boxShadow: 'none',
  textAlign: 'center',
  cursor: 'pointer',
  span: {
    color: theme.palette.primary.main,
    transition: 'color 0.2s ease'
  },
  '&:hover span': {
    color: theme.palette.primary.dark,
    textDecoration: 'underline'
  },
  svg: {
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main
  }
}))

export const TextFiletypes = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: theme.palette.text.secondary
}))
