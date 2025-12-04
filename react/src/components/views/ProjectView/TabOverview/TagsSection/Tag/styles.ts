import Box from '@mui/material/Box'
import { alpha, styled } from '@mui/material/styles'

export const Tag = styled(Box, {
  shouldForwardProp: (prop) =>
    !['focused', 'disabled', 'create'].includes(prop as string)
})<{ focused: boolean; disabled: boolean; create: boolean }>(
  ({ theme, focused, disabled, create }) => ({
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    gap: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    ...(create && {
      borderStyle: 'dashed',
      borderColor: theme.palette.primary.main,
      '& .MuiSvgIcon-root, & input::placeholder': {
        color: theme.palette.primary.main
      }
    }),
    ...(focused && {
      borderStyle: 'solid',
      borderColor: theme.palette.primary.main,
      '& button': {
        opacity: 1
      },
      '& .MuiSvgIcon-root': {
        color: theme.palette.primary.main
      }
    }),
    ...(disabled && {
      pointerEvents: 'none'
    }),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      '& button': {
        opacity: 1
      }
    }
  })
)

export const TagIcon = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'cneter',
  flexShrink: 0,
  color: theme.palette.divider
}))

export const TagInput = styled('input')(({ theme }) => ({
  padding: 0,
  border: 0,
  flexGrow: 1,
  background: 'transparent'
}))

export const DeleteButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  border: 0,
  flexShrink: 0,
  background: 'transparent',
  opacity: 0,
  color: theme.palette.primary.main,
  '&:focus-visible': {
    outline: `1px solid ${theme.palette.primary.main}`
  }
}))
