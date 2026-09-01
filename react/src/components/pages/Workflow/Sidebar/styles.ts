import { IconButton } from '@mui/material'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

export const SIDEBAR_TRANSITION_DURATION_MS = 200

export const SidebarWrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed'
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  position: 'relative',
  width: '290px',
  height: '100%',
  marginLeft: 'auto',
  paddingLeft: '40px',
  flexShrink: 0,
  transition: theme.transitions.create('width', {
    duration: SIDEBAR_TRANSITION_DURATION_MS,
    easing: theme.transitions.easing.sharp
  }),
  '& > .MuiPaper-root': {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '250px',
    height: '100%',
    flexShrink: 0,
    borderRadius: 0,
    boxShadow: '1.05em 0 1em 0.5em #000000',
    overflow: 'auto',
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? 'translateX(100%)' : 'translateX(0)',
    visibility: collapsed ? 'hidden' : 'visible',
    pointerEvents: collapsed ? 'none' : 'auto',
    transition: [
      theme.transitions.create('transform', {
        duration: SIDEBAR_TRANSITION_DURATION_MS,
        easing: theme.transitions.easing.sharp
      }),
      theme.transitions.create('opacity', {
        duration: SIDEBAR_TRANSITION_DURATION_MS,
        easing: theme.transitions.easing.sharp
      }),
      `visibility 0s linear ${collapsed ? SIDEBAR_TRANSITION_DURATION_MS : 0}ms`
    ].join(', '),
    willChange: 'transform, opacity'
  },
  ...(collapsed && {
    width: '40px'
  }),
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '& > .MuiPaper-root': {
      transition: 'none'
    }
  }
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
  boxShadow: '0.3em 0.8em 1.3em 0.35em #c2c2c2',
  border: 0,
  zIndex: 0,
  background: '#dfdfdf',
  gap: '4px',
  '& .MuiToggleButton-root': {
    minWidth: '0',
    width: '40px',
    height: '40px',
    borderRadius: '4px 0 0 4px !important',
    border: 0,
    color: theme.palette.primary.main,
    background: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    },
    '&.Mui-selected': {
      background: theme.palette.primary.main,
      color: theme.palette.common.white,
      '&:hover': {
        background: theme.palette.primary.main
      }
    },
    '&.Mui-disabled': {
      color: '#9e9e9e', // or theme.palette.action.disabled?
      border: 0
    }
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem'
  }
}))

export const GroupWrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'noSeparator'
})<{ separator?: boolean }>(({ theme, separator = true }) => ({
  marginTop: theme.spacing(3),
  paddingTop: separator ? theme.spacing(1) : '',
  borderTop: separator ? `1px solid ${theme.palette.divider}` : '',
  '& h6': {
    fontWeight: 600
  },
  '& ul': {
    marginTop: theme.spacing(3),
    marginBottom: 0,
    padding: 0,
    listStyle: 'none',
    '& ul': {
      marginTop: theme.spacing(1)
    }
  },
  'li + li': {
    marginTop: theme.spacing(1)
  }
}))

export const SidebarTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 600
}))

export const SidebarInnerWrap = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  flexGrow: 1
}))

export const SidebarContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  flexGrow: 1,
  minHeight: 0,
  overflow: 'auto'
}))

export const SidebarActions = styled(Stack)(({ theme }) => ({
  marginTop: 'auto',
  padding: theme.spacing(2),
  gap: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  flexDirection: 'column',
  flexShrink: 0
}))
