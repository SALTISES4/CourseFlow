import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import Link from '@mui/material/Link'
import Fab from '@mui/material/Fab'
import Divider from '@mui/material/Divider'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import HomeIcon from '@mui/icons-material/Home'
import FolderCopyIcon from '@mui/icons-material/CollectionsBookmark'
import SearchIcon from '@mui/icons-material/ManageSearch'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import HelpRoundedIcon from '@mui/icons-material/HelpRounded'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MenuIcon from '@mui/icons-material/Menu'
import useApi from '../../../hooks/useApi'

export const SidebarRootStyles = {
  height: '100%'
}

const LogoWrap = styled(Box)(({ theme }) => ({
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

const Collapse = styled(Fab)(({ theme, collapsed }) => ({
  position: 'absolute',
  right: 0,
  top: '60px',
  transform: 'translateX(50%)',
  color: theme.palette.common.white,
  ...(collapsed && {
    backgroundColor: 'transparent',
    color: theme.palette.primary.main,
    boxShadow: 'none',
    transform: 'translate(4em, -58px)',
    transition: 'color 0.3s ease, background-color 0.3s ease',
    '&:hover': {
      color: theme.palette.common.white,
      backgroundColor: theme.palette.common.light
    }
  })
}))

const SidebarWrap = styled(Box)(({ theme, collapsed }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  ...(collapsed && {
    [`& .MuiPaper-root`]: {
      display: 'none'
    }
  })
}))

const SidebarInner = styled(Paper)({
  display: 'flex',
  flexDirection: 'column',
  width: '256px',
  height: '100%',

  '& .MuiListItemIcon-root': {
    minWidth: 0,
    marginRight: 12
  }
})

const MainMenuWrap = styled(List)({
  '& .MuiListItemText-primary': {
    fontSize: '16px'
  }
})

const FavouritesWrap = styled(Box)({
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

const FavouritesLabel = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  paddingLeft: 16,
  paddingRight: 16,
  color: theme.palette.text.disabled
}))

const SeeAllLink = styled(Link)({
  display: 'block',
  width: '100%',
  fontSize: '14px'
})

const HelpLink = styled(List)(({ theme }) => ({
  marginTop: 'auto',
  paddingTop: theme.spacing(1),
  borderTop: '1px solid rgba(0, 0, 0, 0.12)'
}))

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(
    sessionStorage.getItem('collapsed_sidebar')
  )

  const [apiData, loading, error] = useApi(config.json_api_paths.get_sidebar)

  function toggleCollapse() {
    if (!collapsed) {
      sessionStorage.setItem('collapsed_sidebar', true)
    } else {
      sessionStorage.removeItem('collapsed_sidebar')
    }

    setCollapsed(!collapsed)
  }

  return (
    <SidebarWrap collapsed={collapsed}>
      <Collapse
        color="primary"
        size="small"
        aria-label="collapse sidebar"
        collapsed={collapsed}
        onClick={toggleCollapse}
      >
        {collapsed ? <MenuIcon /> : <ArrowBackIcon />}
      </Collapse>

      <SidebarInner elevation={8}>
        <LogoWrap>
          <CFLogo />
          <Typography component="span">CourseFlow</Typography>
        </LogoWrap>

        <MainMenuWrap sx={{ pt: 0 }}>
          <ListItem disablePadding dense>
            <ListItemButton
              component="a"
              id="panel-home"
              href={config.home_path}
              selected={window.location.pathname === config.home_path}
            >
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary={COURSEFLOW_APP.strings.home} />
            </ListItemButton>
          </ListItem>
          {apiData.is_teacher ? (
            <>
              <ListItem disablePadding dense>
                <ListItemButton
                  component="a"
                  id="panel-my-library"
                  href={config.my_library_path}
                  selected={window.location.pathname === config.my_library_path}
                >
                  <ListItemIcon>
                    <FolderCopyIcon />
                  </ListItemIcon>
                  <ListItemText primary={COURSEFLOW_APP.strings.my_library} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding dense>
                <ListItemButton
                  component="a"
                  id="panel-explore"
                  href={config.explore_path}
                  selected={window.location.pathname === config.explore_path}
                >
                  <ListItemIcon>
                    <SearchIcon />
                  </ListItemIcon>
                  <ListItemText primary={COURSEFLOW_APP.strings.explore} />
                </ListItemButton>
              </ListItem>
            </>
          ) : null}
          {!apiData.is_anonymous ? (
            <ListItem disablePadding dense>
              <ListItemButton
                component="a"
                id="panel-my-live-projects"
                href={config.my_liveprojects_path}
                selected={
                  window.location.pathname === config.my_liveprojects_path
                }
              >
                <ListItemIcon>
                  <CalendarMonthIcon />
                </ListItemIcon>
                <ListItemText primary={COURSEFLOW_APP.strings.my_classrooms} />
              </ListItemButton>
            </ListItem>
          ) : null}
        </MainMenuWrap>

        {apiData.is_teacher && apiData.favourites.length ? (
          <>
            <Divider />
            <FavouritesWrap>
              <FavouritesLabel variant="body1">
                {COURSEFLOW_APP.strings.favourites}
              </FavouritesLabel>
              <List>
                {apiData.favourites.map((favourite, id) => (
                  <ListItem disablePadding dense key={id}>
                    <ListItemButton
                      component="a"
                      href={favourite.url}
                      data-test-id="panel-favourite"
                      selected={window.location.pathname === favourite.url}
                    >
                      <ListItemText primary={favourite.title} />
                    </ListItemButton>
                  </ListItem>
                ))}

                {apiData.favourites.length >= 5 ? (
                  <ListItem disablePadding dense sx={{ mt: 1 }}>
                    <ListItemButton
                      component="a"
                      href={config.my_favourites_path}
                    >
                      <ListItemText
                        primary={
                          <SeeAllLink href={config.my_favourites_path}>
                            {COURSEFLOW_APP.strings.view_all}
                          </SeeAllLink>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ) : null}
              </List>
            </FavouritesWrap>
          </>
        ) : null}

        <HelpLink>
          <ListItem disablePadding dense>
            <ListItemButton
              component="a"
              href="https://courseflow.freshdesk.com/support/home"
            >
              <ListItemIcon>
                <HelpRoundedIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={COURSEFLOW_APP.strings.help_support} />
            </ListItemButton>
          </ListItem>
        </HelpLink>
      </SidebarInner>
    </SidebarWrap>
  )
}

export default Sidebar

const CFLogo = () => (
  <svg width="40" height="40" fill="none">
    <rect width="40" height="40" rx="3" fill="#027A4C" />
    <mask
      id="cf-logo-a"
      style={{ maskType: 'luminance' }}
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="40"
      height="40"
    >
      <rect width="40" height="40" rx="3" fill="#fff" />
    </mask>
    <g mask="url(#cf-logo-a)" fillRule="evenodd" clipRule="evenodd">
      <path
        d="M34.018 1.333 73.37 42.667H-5.333L34.018 1.333Z"
        fill="#04BA74"
      />
      <path
        d="m4.685 25.333 39.352 41.334h-78.704L4.685 25.333Z"
        fill="#12AE72"
      />
      <path d="m26 18.667 28 30H-2l28-30Z" fill="#07E08D" />
    </g>
    <circle cx="20" cy="20" r="11.333" fill="#fff" />
    <mask
      id="cf-logo-b"
      style={{ maskType: 'luminance' }}
      maskUnits="userSpaceOnUse"
      x="13"
      y="13"
      width="14"
      height="14"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.957 20.306h1.569c-.462 1.224-.938 2.413-1.572 3.374l.003-3.374Zm-2.37 0h1.76v4.167a4.643 4.643 0 0 1-1.39 1.071 4.51 4.51 0 0 1-.37.162v-5.4Zm4.82-.61c.488-1.294.991-2.547 1.683-3.539v3.54h-1.684Zm4.047 0h-1.759V15.4a4.569 4.569 0 0 1 1.768-1.152v5.455l-.009-.006Zm-.734-5.8a5.37 5.37 0 0 0-1.798 1.468c-.977 1.206-1.576 2.776-2.166 4.334H13.66a.305.305 0 0 0-.274.136.309.309 0 0 0 .234.477h1.358v5.6a5.775 5.775 0 0 1-1.319.141.307.307 0 0 0-.04.613h.04a5.701 5.701 0 0 0 2.569-.553 5.35 5.35 0 0 0 1.786-1.474c.977-1.207 1.578-2.77 2.162-4.332h6.186a.305.305 0 0 0 .305-.306.305.305 0 0 0-.305-.306h-1.295v-5.627a5.929 5.929 0 0 1 1.223-.12.305.305 0 0 0 .304-.307.305.305 0 0 0-.304-.306h-.005a5.707 5.707 0 0 0-2.564.554l-.001.009Z"
        fill="#fff"
      />
    </mask>
    <g mask="url(#cf-logo-b)">
      <path fill="#027A4C" d="M13.333 13.333h13.333v13.461H13.333z" />
      <mask
        id="cf-logo-c"
        style={{ maskType: 'luminance' }}
        maskUnits="userSpaceOnUse"
        x="13"
        y="13"
        width="14"
        height="14"
      >
        <path fill="#fff" d="M13.333 13.333h13.333v13.461H13.333z" />
      </mask>
    </g>
  </svg>
)
