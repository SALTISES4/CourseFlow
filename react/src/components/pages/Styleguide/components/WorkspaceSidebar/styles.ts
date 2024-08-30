import { alpha, styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { IconButton } from '@mui/material'

export const SidebarWrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed'
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  position: 'relative',
  width: '290px',
  height: '100%',
  marginLeft: 'auto',
  paddingLeft: '30px',
  flexShrink: 0,
  '& .MuiPaper-root': {
    position: 'relative',
    height: '100%',
    padding: theme.spacing(2),
    borderRadius: 0,
    boxShadow: '1.05em 0 1em 0.5em #000000',
    overflow: 'auto'
  },
  ...(collapsed && {
    width: '30px',
    '& .MuiPaper-root': {
      display: 'none'
    }
  })
}))

export const SidebarToggle = styled(IconButton)(() => ({
  position: 'absolute',
  right: '0',
  top: '0'
}))

export const SidebarTabsWrap = styled(ToggleButtonGroup)(({ theme }) => ({
  position: 'absolute',
  top: '3rem',
  left: 0,
  boxShadow: '0.5em 0.5em 1em 0.25em #ddd',
  border: 0,
  zIndex: 0,
  background: 'transparent',
  gap: '2px',
  '& .MuiToggleButton-root': {
    minWidth: '0',
    padding: '5px',
    border: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    color: theme.palette.primary.main,
    background: theme.palette.common.white,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04)
    },
    '&.Mui-selected': {
      background: theme.palette.primary.main,
      color: theme.palette.common.white,
      '&:hover': {
        background: theme.palette.primary.main
      }
    },
    '&.Mui-disabled': {
      color: theme.palette.divider,
      border: 0
    }
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem'
  }
}))

export const GroupWrap = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  paddingTop: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  '& h6': {
    fontWeight: 600
  },
  '& ul': {
    marginTop: theme.spacing(3),
    marginBottom: 0,
    padding: 0,
    listStyle: 'none'
  },
  'li + li': {
    marginTop: theme.spacing(1)
  }
}))
