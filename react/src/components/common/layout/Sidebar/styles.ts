import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import Link from '@mui/material/Link'
import Fab from '@mui/material/Fab'
import Typography from '@mui/material/Typography'

export const SidebarRootStyles = {
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

export const Collapse = styled(Fab)<{ collapsed: boolean }>(
  ({ theme, collapsed }) => ({
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
  })
)

export const SidebarWrap = styled(Box)<{ collapsed: boolean }>(
  ({ theme, collapsed }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    ...(collapsed && {
      [`& .MuiPaper-root`]: {
        display: 'none'
      }
    }),
    ...(!collapsed && {
      '&:not(:hover) .MuiFab-root': {
        opacity: 0,
        visibility: 'hidden'
      }
    })
  })
)

export const SidebarInner = styled(Paper)({
  display: 'flex',
  flexDirection: 'column',
  width: '256px',
  height: '100%',

  '& .MuiListItemIcon-root': {
    minWidth: 0,
    marginRight: 12
  }
})

export const MainMenuWrap = styled(List)({
  '& .MuiListItemText-primary': {
    fontSize: '16px'
  }
})

export const FavouritesWrap = styled(Box)({
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

export const FavouritesLabel = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  paddingLeft: 16,
  paddingRight: 16,
  color: theme.palette.text.disabled
}))

export const SeeAllLink = styled(Link)({
  display: 'block',
  width: '100%',
  fontSize: '14px'
})

export const HelpLink = styled(List)(({ theme }) => ({
  marginTop: 'auto',
  paddingTop: theme.spacing(1),
  borderTop: '1px solid rgba(0, 0, 0, 0.12)'
}))
