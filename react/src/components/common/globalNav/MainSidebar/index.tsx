import {
  LibraryContentTypeIn,
  LibrarySortDirectionIn,
  LibrarySortValueIn
} from '@cf/api/gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { CFRoutes } from '@cf/router/appRoutes'
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
import { useTranslation } from 'react-i18next'
import { Link, generatePath, useLocation } from 'react-router-dom'

import * as SC from './styles'

const FAVORITES_PER_PAGE = 5

const Favorites = () => {
  const { t } = useTranslation('common')
  const location = useLocation()
  const { data, isError } = useLibrarySearch({
    pagination: {
      page: 0,
      resultsPerPage: FAVORITES_PER_PAGE
    },
    sort: {
      value: LibrarySortValueIn.RECENTLY_FAVORITED,
      direction: LibrarySortDirectionIn.DESC
    },
    filters: {
      isFavorite: true,
      contentType: LibraryContentTypeIn.PROJECT
    }
  })

  const SeeAll = () => {
    if (!data || data.meta.totalResults <= FAVORITES_PER_PAGE) {
      return <></>
    }

    return (
      <ListItem disablePadding dense sx={{ mt: 1, mb: 2 }}>
        <ListItemButton component="div" sx={{ padding: 0 }}>
          <ListItemText
            sx={{ margin: 0 }}
            primary={
              <SC.SeeAllLink sx={{ px: 2, py: 1 }} to={CFRoutes.FAVORITES}>
                {t('navigation.viewAll')}
              </SC.SeeAllLink>
            }
          />
        </ListItemButton>
      </ListItem>
    )
  }

  if (!data || !data.items.length || isError) {
    return <></>
  }

  return (
    <>
      <Divider sx={{ mt: 2 }} />

      <SC.SectionWrap>
        <SC.SectionLabel variant="body1">
          {t('navigation.favourites')}
        </SC.SectionLabel>

        <List>
          {data.items.map((item) => (
            <ListItem disablePadding dense key={item.uuid}>
              <ListItemButton
                component={Link}
                to={generatePath(CFRoutes.PROJECT_WORKFLOW, {
                  uuid: String(item.uuid)
                })}
                data-test-id="panel-favourite"
                selected={location.pathname.includes(String(item.uuid))}
              >
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          ))}

          <SeeAll />
        </List>
      </SC.SectionWrap>
    </>
  )
}

const Sidebar = () => {
  const { t } = useTranslation('common')
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
        aria-label={t('navigation.collapseSidebar')}
        collapsed={collapsed}
        onClick={toggleCollapse}
      >
        {collapsed ? <MenuIcon /> : <ArrowBackIcon />}
      </SC.Collapse>

      <SC.SidebarInner
        data-test-id="main-nav-panel"
        aria-hidden={collapsed}
        {...(collapsed ? { inert: '' } : {})}
      >
        <SC.LogoWrap>
          <CFLogo />
          <Typography component="span">CourseFlow</Typography>
        </SC.LogoWrap>

        <SC.NavigationScrollRegion data-test-id="main-nav-scroll-region">
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
                <ListItemText primary={t('navigation.home')} />
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
                <ListItemText primary={t('navigation.myLibrary')} />
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
                <ListItemText primary={t('navigation.explore')} />
              </ListItemButton>
            </ListItem>
          </SC.MainMenuWrap>

          <Favorites />
          <RelatedWorkflowList />
        </SC.NavigationScrollRegion>

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
              <ListItemText primary={t('navigation.helpSupport')} />
            </ListItemButton>
          </ListItem>
        </SC.HelpLink>

        <SC.MainMenuWrap>
          <ListItem dense>
            <Typography variant="caption">
              {t('appVersion')} {__APP_VERSION__}
            </Typography>
          </ListItem>
        </SC.MainMenuWrap>
      </SC.SidebarInner>
    </SC.SidebarWrap>
  )
}

export default Sidebar
