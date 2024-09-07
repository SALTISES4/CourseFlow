import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'

export const Wrap = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: `${theme.spacing(6)} ${theme.spacing(4)}`,
  marginBottom: theme.spacing(4),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center'
}))

export const Actions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3)
}))

export const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  color: theme.palette.primary.main
}))
