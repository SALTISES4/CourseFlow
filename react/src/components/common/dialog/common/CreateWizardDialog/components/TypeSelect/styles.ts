import { alpha, styled } from '@mui/material/styles'

export const TypeBlock = styled('div', {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected: boolean }>(({ theme, selected }) => ({
  display: 'flex',
  width: '100%',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '0.3em',
  gap: theme.spacing(1),
  flexDirection: 'column',
  transition: 'background-color 0.3s ease',
  '> *': {
    padding: theme.spacing(2),
    ':last-child': {
      borderTop: `1px solid ${theme.palette.divider}`
    }
  },
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: alpha(theme.palette.action.hover, 0.04)
  },
  '.MuiSvgIcon-root': {
    fontSize: '40px',
    color: theme.palette.primary.main
  },
  ...(selected && {
    borderColor: theme.palette.primary.main,
    '> *:last-child': {
      borderColor: theme.palette.primary.main
    }
  })
}))
