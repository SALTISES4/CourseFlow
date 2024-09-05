import theme from '@cf/mui/theme'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'

export const FileWrap = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'error'
})<{ error: boolean }>(({ theme, error }) => ({
  margin: `${theme.spacing(1)} 0`,
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  '.MuiSvgIcon-root:first-of-type': {
    padding: theme.spacing(1)
  },
  ...(error && {
    color: theme.palette.error.main
  })
}))

export const FileName = styled('span')(() => ({
  display: 'block',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  color: 'currentColor'
}))

export const FileInfo = styled('div')(() => ({
  display: 'flex',
  gap: theme.spacing(1),
  fontSize: '0.875rem',
  '& ul': {
    margin: 0,
    padding: 0,
    listStyle: 'none'
  }
}))
