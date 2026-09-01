import { LibraryContentTypeOut } from '@cf/api/gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { CFRoutes } from '@cf/router/appRoutes'
import strings from '@cf/utility/strings'
import Loader from '@cfComponents/UIPrimitives/Loader'
import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import RelatedWorkflowList from '@cfPages/Workflow/WorkflowTabs/components/RelatedWorkflowList'
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
import { Link, generatePath, useLocation } from 'react-router-dom'

import * as SC from './styles'

const Favorites = () => {
  const { data, isLoading, isError } = useLibrarySearch({
    pagination: {
      page: 0,
      resultsPerPage: 5
    },
    filters: {
      isFavorite: true
    }
  })

  const SeeAll = () => {
    if (!data || data.meta.totalResults < 5) {
      return <></>
    }

    return (
      <ListItem disablePadding dense sx={{ mt: 1, mb: 2 }}>
        <ListItemButton component="div" sx={{ padding: 0 }}>
          <ListItemText
            sx={{ margin: 0 }}
            primary={
              <SC.SeeAllLink sx={{ px: 2, py: 1 }} to={CFRoutes.FAVORITES}>
                {strings.viewAll}
              </SC.SeeAllLink>
            }
          />
        </ListItemButton>
      </ListItem>
    )
  }

  if (isLoading) {
    return <Loader />
  }

  if (!data || !data.items.length || isError) {
    return <></>
  }

  return (
    <>
      <Divider sx={{ mt: 2 }} />

      <SC.SectionWrap>
        <SC.SectionLabel variant="body1">{strings.favourites}</SC.SectionLabel>

        <List>
          {data.items.map((item, id) => {
            const url =
              item.contentType === LibraryContentTypeOut.PROJECT
                ? generatePath(CFRoutes.PROJECT, {
                    uuid: String(item.uuid)
                  })
                : generatePath(CFRoutes.WORKFLOW, {
                    uuid: String(item.uuid)
                  })

            return (
              <ListItem disablePadding dense key={id}>
                <ListItemButton
                  component={Link}
                  to={url}
                  data-test-id="panel-favourite"
                  selected={location.pathname === url}
                >
                  <ListItemText primary={item.title} />
                </ListItemButton>
              </ListItem>
            )
          })}

          <SeeAll />
        </List>
      </SC.SectionWrap>
    </>
  )
}

const Sidebar = () => {
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
    <SC.SidebarWrap collapsed={collapsed} data-test-id="main-nav">
      <SC.Collapse
        color="primary"
        size="small"
        aria-label="collapse sidebar"
        collapsed={collapsed}
        onClick={toggleCollapse}
      >
        {collapsed ? <MenuIcon /> : <ArrowBackIcon />}
      </SC.Collapse>

      <SC.SidebarInner
        elevation={8}
        aria-hidden={collapsed}
        {...(collapsed ? { inert: '' } : {})}
      >
        <SC.LogoWrap>
          <CFLogo />
          <Typography component="span">CourseFlow</Typography>
        </SC.LogoWrap>

        <SC.MainMenuWrap>
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
              <ListItemText primary={strings.myLibrary} />
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
        </SC.MainMenuWrap>

        <Favorites />
        <RelatedWorkflowList />

        <SC.HelpLink>
          <ListItem disablePadding dense>
            <ListItemButton
              component="a"
              target="_blank"
              href="https://courseflow.freshdesk.com/support/home"
            >
              <ListItemIcon>
                <HelpRoundedIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={strings.helpSupport} />
            </ListItemButton>
          </ListItem>
        </SC.HelpLink>
      </SC.SidebarInner>
    </SC.SidebarWrap>
  )
}

export default Sidebar
