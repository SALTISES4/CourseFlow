import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import List from '@mui/material/List'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'

const SIDEBAR_WIDTH = '256px'
const SIDEBAR_TRANSITION_DURATION_MS = 200

export const MainSidebarRootStyles = {
  height: '100%'
}

export const LogoWrap = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  paddingTop: theme.spacing(2),
  paddingLeft: 16,
  paddingRight: 16,
  paddingBottom: theme.spacing(6),
  '& > svg': {
    marginRight: theme.spacing(2)
  }
}))

export const Collapse = styled(Fab, {
  shouldForwardProp: (prop) => prop !== 'collapsed'
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  position: 'absolute',
  right: 0,
  top: '60px',
  transform: 'translateX(50%)',
  transition: 'opacity 0.15s ease, visibility 0.15s ease',
  color: theme.palette.common.white,
  ...(collapsed && {
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    boxShadow: 'none',
    transform: 'translate(4em, -58px)',
    transition: 'color 0.3s ease, background-color 0.3s ease',
    '&:hover': {
      color: theme.palette.common.white
      // backgroundColor: theme.palette.common.light
    }
  })
}))

export const SidebarWrap = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed'
})<{ collapsed: boolean }>(({ theme, collapsed }) => ({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  zIndex: 1,
  width: collapsed ? 0 : SIDEBAR_WIDTH,
  height: '100%',
  flexShrink: 0,
  transition: theme.transitions.create('width', {
    duration: SIDEBAR_TRANSITION_DURATION_MS,
    easing: theme.transitions.easing.sharp
  }),
  '& > .MuiPaper-root': {
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
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
    '& ~ .main-block .back-links-wrap': {
      paddingLeft: theme.spacing(5)
    }
  }),
  ...(!collapsed && {
    '&:not(:hover) .MuiFab-root': {
      opacity: 0,
      visibility: 'hidden'
    }
  }),
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '& > .MuiPaper-root': {
      transition: 'none'
    }
  }
}))

export const SidebarInner = styled(Paper)({
  display: 'flex',
  flexDirection: 'column',
  width: SIDEBAR_WIDTH,
  height: '100%',
  flexShrink: 0,

  '& .MuiListItemIcon-root': {
    minWidth: 0,
    marginRight: 12
  }
})

export const MainMenuWrap = styled(List)({
  paddingTop: 0,
  paddingBottom: 0,
  '& .MuiListItemText-primary': {
    fontSize: '16px'
  }
})

export const SectionWrap = styled(Box)({
  overflow: 'auto',
  '& .MuiListItemText-primary': {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },
  '& .MuiList-root': {
    padding: 0
  }
})

export const SectionLabel = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  paddingLeft: 16,
  paddingRight: 16,
  color: theme.palette.text.disabled
}))

export const SeeAllLink = styled(RouterLink)(({ theme }) => ({
  display: 'block',
  width: '100%',
  fontSize: '14px',
  color: theme.palette.primary.main
}))

export const HelpLink = styled(List)(({ theme }) => ({
  marginTop: 'auto',
  paddingTop: theme.spacing(1),
  borderTop: '1px solid rgba(0, 0, 0, 0.12)'
}))
