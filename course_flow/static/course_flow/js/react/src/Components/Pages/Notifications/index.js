import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment
} from 'react/jsx-runtime'
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
import useApi from '../../../hooks/useApi'
import { OuterContentWrap } from '../../../mui/helper'
import { DATA_ACTIONS } from '@XMLHTTP/common'
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
function API_POST(url = '', data = {}) {
  if (!url) {
    return Promise.reject('You need to specify an URL in for API_POST to run.')
  }
  return new Promise((res, rej) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': root.getCsrfToken()
      },
      body: JSON.stringify(data)
    })
      // convert to JSON
      .then((response) => response.json())
      .then((data) => {
        // and if the action successfully posted, resolve the initial promise
        if (data.action === DATA_ACTIONS.POSTED) {
          res(data)
        } else {
          rej(url, 'post action !== "posted".')
        }
      })
      // otherwise reject if anything fishy is going on
      .catch((err) => rej(err))
  })
}
const NotificationsPage = () => {
  const [pagination, setPagination] = useState({
    page: 0,
    countPerPage: 10
  })
  const [apiData, loading, error] = useApi(
    config.json_api_paths.get_notifications_page
  )
  const [pageState, setPageState] = useState({
    notifications: [],
    allRead: false,
    menuAnchor: null,
    notification: null
  })
  useEffect(() => {
    if (pageState.notifications.length === 0 && apiData.notifications) {
      setPageState({
        ...pageState,
        notifications: apiData.notifications
      })
    }
  }, [apiData])
  if (loading || error) {
    return null
  }
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
    API_POST(config.json_api_paths.mark_all_notifications_as_read, {
      notification_id: notification.id
    })
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
    API_POST(config.json_api_paths.delete_notification, {
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
    API_POST(config.json_api_paths.mark_all_notifications_as_read)
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
  return _jsx(OuterContentWrap, {
    children:
      pageState.notifications.length > 0
        ? _jsxs(_Fragment, {
            children: [
              _jsxs(NotificationsWrap, {
                children: [
                  _jsxs(NotificationsHeader, {
                    children: [
                      _jsx(Typography, {
                        variant: 'h1',
                        children: COURSEFLOW_APP.strings.notifications
                      }),
                      apiData.unread > 0 &&
                        !pageState?.allRead &&
                        _jsx(MarkAsRead, {
                          children: _jsx(Link, {
                            href: '#',
                            underline: 'always',
                            onClick: onMarkAllAsReadClick,
                            children: COURSEFLOW_APP.strings.mark_all_as_read
                          })
                        })
                    ]
                  }),
                  _jsx(NotificationsList, {
                    children: pageState.notifications
                      .slice(paginateFrom, paginateTo)
                      .map((n, idx) =>
                        _jsx(
                          StyledListItem,
                          {
                            alignItems: 'flex-start',
                            sx: {
                              backgroundColor:
                                n.unread && !pageState.allRead
                                  ? 'primary.lightest'
                                  : null
                            },
                            secondaryAction: _jsx(IconButton, {
                              onClick: (e) => handleMenuOpen(e, n),
                              'aria-label':
                                COURSEFLOW_APP.strings.show_notifications_menu,
                              'aria-haspopup': 'true',
                              children: _jsx(DotsIcon, {})
                            }),
                            children: _jsxs(ListItemButton, {
                              children: [
                                n.unread &&
                                  !pageState.allRead &&
                                  _jsx(Badge, {
                                    color: 'primary',
                                    variant: 'dot'
                                  }),
                                _jsx(ListItemAvatar, {
                                  children: _jsx(Avatar, {
                                    alt: n.from,
                                    children: `${n.from.split(' ')[0][0]}${
                                      n.from.split(' ')[1][0]
                                    }`
                                  })
                                }),
                                _jsx(ListItemText, {
                                  primary: `${n.from} • ${n.date}`,
                                  secondary: _jsx(Typography, {
                                    sx: { display: 'inline' },
                                    component: 'span',
                                    variant: 'body2',
                                    color: 'text.primary',
                                    children: n.text
                                  })
                                })
                              ]
                            })
                          },
                          idx
                        )
                      )
                  }),
                  _jsxs(Menu, {
                    id: 'notification-menu',
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'right'
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'right'
                    },
                    anchorEl: pageState.menuAnchor,
                    open: !!pageState.menuAnchor,
                    onClose: handleMenuClose,
                    MenuListProps: {
                      'aria-label': COURSEFLOW_APP.strings.notification_options
                    },
                    children: [
                      pageState.notification?.unread &&
                        !pageState.allRead &&
                        _jsx(MenuItem, {
                          onClick: onMarkAsReadClick,
                          children: COURSEFLOW_APP.strings.mark_as_read
                        }),
                      _jsx(MenuItem, {
                        onClick: onDeleteClick,
                        children: COURSEFLOW_APP.strings.delete
                      })
                    ]
                  })
                ]
              }),
              totalPaginationPages > 1 &&
                _jsx(StyledPagination, {
                  count: totalPaginationPages,
                  page: pagination.page + 1,
                  onChange: onPaginationChange,
                  showFirstButton: true,
                  showLastButton: true
                })
            ]
          })
        : _jsx(NotificationsWrap, {
            children: _jsxs(NotificationsHeader, {
              children: [
                _jsx(Typography, {
                  variant: 'h1',
                  children: COURSEFLOW_APP.strings.notifications
                }),
                _jsx(Typography, {
                  sx: { marginTop: 3 },
                  children: COURSEFLOW_APP.strings.no_notifications_yet
                })
              ]
            })
          })
  })
}
export default NotificationsPage
