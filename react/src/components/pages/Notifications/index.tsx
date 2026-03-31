import * as SCCommon from '@cf/mui/helper'
import strings from '@cf/utility/strings'
import Loader from '@cfComponents/UIPrimitives/Loader'
import DotsIcon from '@mui/icons-material/MoreHoriz'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { getErrorMessage } from '@XMLHTTP/API/api'
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation
} from '@XMLHTTP/API/notifications.rtk'
import { useState } from 'react'

import * as SC from './style'

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
  const { data, error, isLoading, isError, refetch } = useGetNotificationsQuery()
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation()
  const [markAsRead] = useMarkNotificationAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const [pagination, setPagination] = useState<{
    page: number
    countPerPage: number
  }>({
    page: 0,
    countPerPage: 10
  })

  const [pageState, setPageState] = useState<{
    menuAnchor: any
    notification: any
  }>({
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
    if (!notification) return
    markAsRead({ uuid: notification.uuid })
      .then(() => refetch())
      .finally(() => handleMenuClose())
  }

  /**
   * // @todo move to react query
   */
  function onDeleteClick() {
    const { notification } = pageState
    if (!notification) return
    deleteNotification({ uuid: notification.uuid })
      .then(() => refetch())
      .finally(() => handleMenuClose())
  }

  /**
   * // @todo move to react query
   */
  function onMarkAllAsReadClick(e) {
    e.preventDefault()
    markAllAsRead().then(() => refetch())
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
  if (isLoading) {
    return <Loader />
  }
  if (isError) {
    return <div>An error occurred: {getErrorMessage(error)}</div>
  }

  const { items, meta } = data
  const totalPaginationPages = Math.ceil(
    items.length / pagination.countPerPage
  )
  const paginateFrom = pagination.page * pagination.countPerPage
  const paginateTo = (pagination.page + 1) * pagination.countPerPage

  /*******************************************************
   * RENDER
   *******************************************************/
  if (items.length > 0) {
    return (
      <SCCommon.OuterContentWrap>
        <SC.NotificationsWrap>
          <SC.NotificationsHeader>
            <Typography variant="h1">{strings.notifications}</Typography>
            {meta.unread_count > 0 && (
              <SC.MarkAsRead>
                <Link
                  href="#"
                  underline="always"
                  onClick={onMarkAllAsReadClick}
                >
                  {strings.markAllAsRead}
                </Link>
              </SC.MarkAsRead>
            )}
          </SC.NotificationsHeader>

          <SC.NotificationsList>
            {items
              .slice(paginateFrom, paginateTo)
              .map((n, idx) => (
                <SC.StyledListItem
                  key={idx}
                  alignItems="flex-start"
                  sx={{
                    backgroundColor:
                      !n.is_read
                        ? 'courseflow.lightest'
                        : null
                  }}
                  secondaryAction={
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, n)}
                      aria-label={strings.showNotificationsMenu}
                      aria-haspopup="true"
                    >
                      <DotsIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton>
                    {!n.is_read && (
                      <Badge color="primary" variant="dot" />
                    )}
                    <ListItemText
                      primary={n.date_created}
                      secondary={
                        <Typography
                          sx={{ display: 'inline' }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {n.message}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </SC.StyledListItem>
              ))}
          </SC.NotificationsList>

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
              'aria-label': strings.notificationOptions
            }}
          >
            {pageState.notification && !pageState.notification.is_read && (
              <MenuItem onClick={onMarkAsReadClick}>
                {strings.markAsRead}
              </MenuItem>
            )}
            <MenuItem onClick={onDeleteClick}>{strings.delete}</MenuItem>
          </Menu>
        </SC.NotificationsWrap>

        {totalPaginationPages > 1 && (
          <SC.StyledPagination
            count={totalPaginationPages}
            page={pagination.page + 1}
            onChange={onPaginationChange}
            showFirstButton
            showLastButton
          />
        )}
      </SCCommon.OuterContentWrap>
    )
  }

  return (
    <SCCommon.OuterContentWrap>
      <SC.NotificationsWrap>
        <SC.NotificationsHeader>
          <Typography variant="h1">{strings.notifications}</Typography>
          <Typography sx={{ marginTop: 3 }}>
            {strings.noNotificationsYet}
          </Typography>
        </SC.NotificationsHeader>
      </SC.NotificationsWrap>
    </SCCommon.OuterContentWrap>
  )
}

export default NotificationsPage
