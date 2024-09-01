import React, { useState } from 'react'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import HomeIcon from '@mui/icons-material/Home'
import FolderCopyIcon from '@mui/icons-material/FolderCopy'
import SearchIcon from '@mui/icons-material/Search'
import HelpRoundedIcon from '@mui/icons-material/HelpRounded'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MenuIcon from '@mui/icons-material/Menu'
import { SidebarProps } from '@cf/types/common'
import { Link, useLocation } from 'react-router-dom'

import {
  LogoWrap,
  Collapse,
  SidebarWrap,
  SidebarInner,
  MainMenuWrap,
  FavouritesWrap,
  FavouritesLabel,
  SeeAllLink,
  HelpLink
} from './styles'
import ParentWorkflowIndicator from '@cfViews/WorkflowView/WorkflowViewLayout/components/ParentWorkflowIndicator'
import CFLogo from "@cfComponents/UIPrimitives/SVG/CFLogo";

const Sidebar = ({ isAnonymous, isTeacher, favourites }: SidebarProps) => {
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(
    !!sessionStorage.getItem('collapsed_sidebar')
  )

  function toggleCollapse() {
    if (!collapsed) {
      sessionStorage.setItem('collapsed_sidebar', 'true')
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
              component={Link}
              data-test-id="panel-home"
              to={COURSEFLOW_APP.globalContextData.path.html.library.home}
              selected={
                location.pathname ===
                COURSEFLOW_APP.globalContextData.path.html.library.home
              }
            >
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText
                primary={COURSEFLOW_APP.globalContextData.strings.home}
              />
            </ListItemButton>
          </ListItem>
          {isTeacher ? (
            <>
              <ListItem disablePadding dense>
                <ListItemButton
                  component={Link}
                  data-test-id="panel-library"
                  to={
                    COURSEFLOW_APP.globalContextData.path.html.library.library
                  }
                  selected={
                    location.pathname ===
                    COURSEFLOW_APP.globalContextData.path.html.library.library
                  }
                >
                  <ListItemIcon>
                    <FolderCopyIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      COURSEFLOW_APP.globalContextData.strings.my_library
                    }
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding dense>
                <ListItemButton
                  component={Link}
                  to={
                    COURSEFLOW_APP.globalContextData.path.html.library.explore
                  }
                  data-test-id="panel-explore"
                  selected={
                    location.pathname ===
                    COURSEFLOW_APP.globalContextData.path.html.library.explore
                  }
                >
                  <ListItemIcon>
                    <SearchIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={COURSEFLOW_APP.globalContextData.strings.explore}
                  />
                </ListItemButton>
              </ListItem>
            </>
          ) : null}
        </MainMenuWrap>

        {isTeacher && favourites.length ? (
          <>
            <Divider />
            <FavouritesWrap>
              <FavouritesLabel variant="body1">
                {COURSEFLOW_APP.globalContextData.strings.favourites}
              </FavouritesLabel>
              <List>
                {favourites.map((favourite, id) => (
                  <ListItem disablePadding dense key={id}>
                    <ListItemButton
                      component={Link}
                      to={favourite.url}
                      data-test-id="panel-favourite"
                      selected={location.pathname === favourite.url}
                    >
                      <ListItemText primary={favourite.title} />
                    </ListItemButton>
                  </ListItem>
                ))}

                {favourites.length >= 5 ? (
                  <ListItem disablePadding dense sx={{ mt: 1 }}>
                    <ListItemButton
                      component="div"
                      sx={{
                        padding: 0
                      }}
                    >
                      <ListItemText
                        sx={{
                          margin: 0
                        }}
                        primary={
                          <SeeAllLink
                            sx={{
                              px: 2,
                              py: 1
                            }}
                            // @todo convert this to a Link element
                            href={
                              COURSEFLOW_APP.globalContextData.path.html.library
                                .favourites
                            }
                          >
                            {COURSEFLOW_APP.globalContextData.strings.view_all}
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

        <ParentWorkflowIndicator />

        <HelpLink>
          <ListItem disablePadding dense>
            <ListItemButton
              component="a"
              target="_blank"
              href="https://courseflow.freshdesk.com/support/home"
            >
              <ListItemIcon>
                <HelpRoundedIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={COURSEFLOW_APP.globalContextData.strings.help_support}
              />
            </ListItemButton>
          </ListItem>
        </HelpLink>
      </SidebarInner>
    </SidebarWrap>
  )
}

export default Sidebar
