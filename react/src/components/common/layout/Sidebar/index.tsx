import { CFRoutes } from '@cf/router'
import { SidebarProps } from '@cf/types/common'
import strings from '@cf/utility/strings'
import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import ParentWorkflowIndicator from '@cfPages/Workspace/Workflow/WorkflowTabs/components/ParentWorkflowIndicator'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FolderCopyIcon from '@mui/icons-material/FolderCopy'
import HelpRoundedIcon from '@mui/icons-material/HelpRounded'
import HomeIcon from '@mui/icons-material/Home'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
  Collapse,
  FavouritesLabel,
  FavouritesWrap,
  HelpLink,
  LogoWrap,
  MainMenuWrap,
  SeeAllLink,
  SidebarInner,
  SidebarWrap
} from './styles'

const Sidebar = ({ isAnonymous,  favourites }: SidebarProps) => {
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
              to={CFRoutes.HOME}
              selected={location.pathname === CFRoutes.HOME}
            >
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary={strings.home} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding dense>
            <ListItemButton
              component={Link}
              data-test-id="panel-library"
              to={CFRoutes.LIBRARY}
              selected={location.pathname === CFRoutes.LIBRARY}
            >
              <ListItemIcon>
                <FolderCopyIcon />
              </ListItemIcon>
              <ListItemText primary={strings.my_library} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding dense>
            <ListItemButton
              component={Link}
              to={CFRoutes.EXPLORE}
              data-test-id="panel-explore"
              selected={location.pathname === CFRoutes.EXPLORE}
            >
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary={strings.explore} />
            </ListItemButton>
          </ListItem>
        </MainMenuWrap>

        {favourites.length ? (
          <>
            <Divider />
            <FavouritesWrap>
              <FavouritesLabel variant="body1">
                {strings.favourites}
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
                            href={CFRoutes.FAVOURITES}
                          >
                            {strings.view_all}
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
          {process.env.NODE_ENV !== 'production' && (
            <ListItem disablePadding dense>
              <ListItemButton component={Link} to={CFRoutes.STYLEGUIDE}>
                <ListItemText primary="Styleguide" />
              </ListItemButton>
            </ListItem>
          )}
          <ListItem disablePadding dense>
            <ListItemButton
              component="a"
              target="_blank"
              href="https://courseflow.freshdesk.com/support/home"
            >
              <ListItemIcon>
                <HelpRoundedIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={strings.help_support} />
            </ListItemButton>
          </ListItem>
        </HelpLink>
      </SidebarInner>
    </SidebarWrap>
  )
}

export default Sidebar
