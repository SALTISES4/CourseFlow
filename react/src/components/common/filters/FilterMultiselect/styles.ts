import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import { alpha, styled } from '@mui/material/styles'

export const StyledButton = styled(Button, {
  shouldForwardProp: (prop) =>
    !['menuActive', 'hasValue'].includes(prop as string)
})<{ menuActive: boolean; hasValue: boolean }>(
  ({ theme, menuActive, hasValue }) => ({
    position: 'relative',
    boxShadow: 'none',
    '&:hover': {
      boxShadow: 'none'
    },
    ...(menuActive &&
      !hasValue && {
        backgroundColor: alpha(theme.palette.primary.main, 0.04)
      })
  })
)

export const StyledPopover = styled(Popover)(({ theme }) => ({
  marginTop: theme.spacing(1),
  '& .MuiPaper-root': {
    minWidth: '300px'
  },
  '& .MuiMenuItem-root': {
    padding: `0 ${theme.spacing(1)}`
  }
}))

export const StyledMenu = styled('div')(({ theme }) => ({
  maxHeight: `${2.375 * 7}em`,
  padding: `${theme.spacing(1)} 0`,
  overflow: 'auto'
}))

export const StyledCounter = styled('span')(({ theme }) => ({
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  width: '20px',
  height: '20px',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  fontSize: '12px',
  borderRadius: '100%',
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.common.white
}))

export const StyledSearch = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  '& .MuiFormLabel-root': {
    transform: 'translate(0, -1.5px) scale(0.75)'
  }
}))

export const StyledActions = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1)
}))
