import React, { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Badge from '@mui/material/Badge'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Pagination from '@mui/material/Pagination'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import DotsIcon from '@mui/icons-material/MoreHoriz'

import { OuterContentWrap } from '@cfModule/mui/helper'
import { API_POST } from '@XMLHTTP/PostFunctions'

const NotificationsWrap = styled(Box)({})

const NotificationsHeader = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(2),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

const MarkAsRead = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  textAlign: 'right'
}))

const NotificationsList = styled(List)(({ theme }) => ({
  paddingTop: 0,
  paddingBottom: 0,
  marginBottom: theme.spacing(1),
  '& .MuiListItem-root': {
    padding: 0
  },
  '& .MuiListItemButton-root': {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(4),
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  '& .MuiBadge-root': {
    position: 'absolute',
    left: theme.spacing(1.7),
    top: '50%'
  }
}))

const StyledListItem = styled(ListItem)({
  '& > .MuiButtonBase-root': {
    paddingRight: '4em'
  }
})

const StyledPagination = styled(Pagination)(({ theme }) => ({
  marginTop: theme.spacing(4),
  '& .MuiPagination-ul': {
    justifyContent: 'center'
  },
  '& .MuiPaginationItem-root.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark
    }
  }
}))

const NotificationsPage = ({ notifications, unreadCount }) => {
  const [pagination, setPagination] = useState({
    page: 0,
    countPerPage: 10
  })

  const [pageState, setPageState] = useState({
    notifications,
    allRead: unreadCount === 0,
    menuAnchor: null,
    notification: null
  })

  const paginateFrom = pagination.page * pagination.countPerPage
  const paginateTo = (pagination.page + 1) * pagination.countPerPage

  function handleMenuOpen(event, notification) {
    // a11y
    event.currentTarget.setAttribute('aria-controls', 'notification-men')
    event.currentTarget.setAttribute('aria-expanded', true)

    setPageState({
      ...pageState,
      notification,
      menuAnchor: event.currentTarget
    })
  }

  function handleMenuClose() {
    // a11y
    pageState.menuAnchor.removeAttribute('aria-controls', null)
    pageState.menuAnchor.setAttribute('aria-expanded', false)
    setPageState((state) => {
      return {
        ...state,
        notification: null,
        menuAnchor: null
      }
    })
  }

  function onMarkAsReadClick() {
    const { notification } = pageState

    // fire the post request
    API_POST(
      COURSEFLOW_APP.config.json_api_paths.mark_all_notifications_as_read,
      {
        notification_id: notification.id
      }
    )
      .then(() => {
        const updated = [...pageState.notifications]
        const index = updated.findIndex((n) => n.id === notification.id)
        updated[index].unread = false

        setPageState({
          ...pageState,
          allRead: updated.every((n) => n.unread === false),
          notifications: updated
        })
      })
      .catch((err) => console.log('error -', err))
      .finally(() => {
        handleMenuClose()
      })
  }

  function onDeleteClick() {
    const { notification } = pageState

    API_POST(COURSEFLOW_APP.config.json_api_paths.delete_notification, {
      notification_id: notification.id
    })
      .then(() => {
        let updated = [...pageState.notifications]
        const index = updated.findIndex((n) => n.id === notification.id)
        updated.splice(index, 1)

        setPageState({
          ...pageState,
          allRead: updated.every((n) => n.unread === false),
          notifications: updated
        })
      })
      .catch((err) => console.log('error -', err))
      .finally(() => {
        handleMenuClose()
      })
  }

  function onMarkAllAsReadClick(e) {
    e.preventDefault()

    API_POST(
      COURSEFLOW_APP.config.json_api_paths.mark_all_notifications_as_read
    )
      .then(() => {
        setPageState({
          ...pageState,
          allRead: true
        })
      })
      .catch((err) => console.log('error -', err))
  }

  function onPaginationChange(e, page) {
    setPagination({
      ...pagination,
      page: page - 1
    })
  }

  const totalPaginationPages = Math.ceil(
    pageState.notifications.length / pagination.countPerPage
  )

  return (
    <OuterContentWrap>
      {pageState.notifications.length > 0 ? (
        <>
          <NotificationsWrap>
            <NotificationsHeader>
              <Typography variant="h1">
                {COURSEFLOW_APP.strings.notifications}
              </Typography>
              {unreadCount > 0 && !pageState?.allRead && (
                <MarkAsRead>
                  <Link
                    href="#"
                    underline="always"
                    onClick={onMarkAllAsReadClick}
                  >
                    {COURSEFLOW_APP.strings.mark_all_as_read}
                  </Link>
                </MarkAsRead>
              )}
            </NotificationsHeader>

            <NotificationsList>
              {pageState.notifications
                .slice(paginateFrom, paginateTo)
                .map((n, idx) => (
                  <StyledListItem
                    key={idx}
                    alignItems="flex-start"
                    sx={{
                      backgroundColor:
                        n.unread && !pageState.allRead
                          ? 'primary.lightest'
                          : null
                    }}
                    secondaryAction={
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, n)}
                        aria-label={
                          COURSEFLOW_APP.strings.show_notifications_menu
                        }
                        aria-haspopup="true"
                      >
                        <DotsIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton>
                      {n.unread && !pageState.allRead && (
                        <Badge color="primary" variant="dot" />
                      )}
                      <ListItemAvatar>
                        <Avatar alt={n.from}>
                          {`${n.from.split(' ')[0][0]}${
                            n.from.split(' ')[1][0]
                          }`}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${n.from} • ${n.date}`}
                        secondary={
                          <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {n.text}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </StyledListItem>
                ))}
            </NotificationsList>

            <Menu
              id="notification-menu"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              anchorEl={pageState.menuAnchor}
              open={!!pageState.menuAnchor}
              onClose={handleMenuClose}
              MenuListProps={{
                'aria-label': COURSEFLOW_APP.strings.notification_options
              }}
            >
              {pageState.notification?.unread && !pageState.allRead && (
                <MenuItem onClick={onMarkAsReadClick}>
                  {COURSEFLOW_APP.strings.mark_as_read}
                </MenuItem>
              )}
              <MenuItem onClick={onDeleteClick}>
                {COURSEFLOW_APP.strings.delete}
              </MenuItem>
            </Menu>
          </NotificationsWrap>

          {totalPaginationPages > 1 && (
            <StyledPagination
              count={totalPaginationPages}
              page={pagination.page + 1}
              onChange={onPaginationChange}
              showFirstButton
              showLastButton
            />
          )}
        </>
      ) : (
        <NotificationsWrap>
          <NotificationsHeader>
            <Typography variant="h1">
              {COURSEFLOW_APP.strings.notifications}
            </Typography>
            <Typography sx={{ marginTop: 3 }}>
              {COURSEFLOW_APP.strings.no_notifications_yet}
            </Typography>
          </NotificationsHeader>
        </NotificationsWrap>
      )}
    </OuterContentWrap>
  )
}

export default NotificationsPage
