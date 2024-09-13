import { OuterContentWrap } from '@cf/mui/helper'
import { apiPaths } from '@cf/router/apiRoutes'
import strings from '@cf/utility/strings'
import { getNameInitials } from '@cf/utility/utilityFunctions'
import Loader from '@cfComponents/UIPrimitives/Loader'
import DotsIcon from '@mui/icons-material/MoreHoriz'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { getNotifications } from '@XMLHTTP/API/notifications'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { NotificationQueryResp } from '@XMLHTTP/types/query'
import { useState } from 'react'

import * as Styled from './style'

/**
 *
 * @param notifications
 * @param unreadCount
 * @returns {JSX.Element}
 * @constructor
 */
const NotificationsPage = (): JSX.Element => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { data, error, isLoading, isError } = useQuery<NotificationQueryResp>({
    queryKey: ['getNotifications'],
    queryFn: getNotifications
  })

  const [pagination, setPagination] = useState<{
    page: number
    countPerPage: number
  }>({
    page: 0,
    countPerPage: 10
  })

  const [pageState, setPageState] = useState<{
    notifications: any
    allRead: any
    menuAnchor: any
    notification: any
  }>({
    notifications: [],
    allRead: 0,
    menuAnchor: null,
    notification: null
  })

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  /**
   *
   * @param event
   * @param notification
   */
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

  /**
   *
   */
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

  /**
   * // @todo move to react query
   */
  function onMarkAsReadClick() {
    const { notification } = pageState

    const url = apiPaths.json_api.notification.mark_all_as_read
    API_POST(url, {
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

  /**
   * // @todo move to react query
   */
  function onDeleteClick() {
    const { notification } = pageState

    const url = apiPaths.json_api.notification.delete
    API_POST(url, {
      notification_id: notification.id
    })
      .then(() => {
        const updated = [...pageState.notifications]
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

  /**
   * // @todo move to react query
   */
  function onMarkAllAsReadClick(e) {
    e.preventDefault()
    const url = apiPaths.json_api.notification.mark_all_as_read

    API_POST(url)
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

  /*******************************************************
   * CONSTANTS / VARIABLES for render
   *******************************************************/
  if (isLoading) return <Loader />
  if (isError) return <div>An error occurred: {error.message}</div>

  const { notifications, unreadCount } = data.data_package
  const totalPaginationPages = Math.ceil(
    pageState.notifications.length / pagination.countPerPage
  )
  const paginateFrom = pagination.page * pagination.countPerPage
  const paginateTo = (pagination.page + 1) * pagination.countPerPage

  /*******************************************************
   * RENDER
   *******************************************************/
  if (pageState.notifications.length > 0) {
    return (
      <OuterContentWrap>
        <Styled.NotificationsWrap>
          <Styled.NotificationsHeader>
            <Typography variant="h1">{strings.notifications}</Typography>
            {unreadCount > 0 && !pageState?.allRead && (
              <Styled.MarkAsRead>
                <Link
                  href="#"
                  underline="always"
                  onClick={onMarkAllAsReadClick}
                >
                  {strings.mark_all_as_read}
                </Link>
              </Styled.MarkAsRead>
            )}
          </Styled.NotificationsHeader>

          <Styled.NotificationsList>
            {pageState.notifications
              .slice(paginateFrom, paginateTo)
              .map((n, idx) => (
                <Styled.StyledListItem
                  key={idx}
                  alignItems="flex-start"
                  sx={{
                    backgroundColor:
                      n.unread && !pageState.allRead
                        ? 'courseflow.lightest'
                        : null
                  }}
                  secondaryAction={
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, n)}
                      aria-label={strings.show_notifications_menu}
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
                      <Avatar alt={n.from}>{getNameInitials(n.from)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={n.date}
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
                </Styled.StyledListItem>
              ))}
          </Styled.NotificationsList>

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
              'aria-label': strings.notification_options
            }}
          >
            {pageState.notification?.unread && !pageState.allRead && (
              <MenuItem onClick={onMarkAsReadClick}>
                {strings.mark_as_read}
              </MenuItem>
            )}
            <MenuItem onClick={onDeleteClick}>{strings.delete}</MenuItem>
          </Menu>
        </Styled.NotificationsWrap>

        {totalPaginationPages > 1 && (
          <Styled.StyledPagination
            count={totalPaginationPages}
            page={pagination.page + 1}
            onChange={onPaginationChange}
            showFirstButton
            showLastButton
          />
        )}
      </OuterContentWrap>
    )
  }

  return (
    <OuterContentWrap>
      <Styled.NotificationsWrap>
        <Styled.NotificationsHeader>
          <Typography variant="h1">{strings.notifications}</Typography>
          <Typography sx={{ marginTop: 3 }}>
            {strings.no_notifications_yet}
          </Typography>
        </Styled.NotificationsHeader>
      </Styled.NotificationsWrap>
    </OuterContentWrap>
  )
}

export default NotificationsPage
