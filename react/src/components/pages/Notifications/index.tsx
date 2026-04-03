/**
 * Notifications inbox (current user).
 *
 * Data & behavior:
 * - List load: GET `/api/user/me/notifications?page=&page_size=` (both query params; **1-based** `page`).
 * - Backend returns `{ items, meta }` where `meta` includes `total`, `total_pages`, `current_page`,
 *   `page_size`, and `unread_count` (unread is across the full inbox, not only the current page).
 * - Rows are rendered from `items` as returned for that page — no client-side slicing of a full list.
 * - Local UI state: current `page` (1-based, aligned with API and MUI Pagination), menu anchor, selected row.
 * - If the server clamps `page` (e.g. after a delete), `meta.current_page` is synced into local state.
 * - Mutations invalidate all `listMyNotifications` queries so the current page refetches.
 *
 * Consumed fields per row: `uuid`, `is_read`, `message`, `date_created`.
 */
import {
  deleteOneNotificationMutation,
  listMyNotificationsOptions,
  markAllMyNotificationsAsReadMutation,
  markOneNotificationAsReadMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import type { NotificationItemOut } from '@cf/api/gen/types.gen'
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
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { getErrorMessage } from '@XMLHTTP/API/api'
import { type MouseEvent, useEffect, useState } from 'react'

import * as SC from './style'

const PAGE_SIZE = 10

const invalidateAllNotificationListQueries = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const head = q.queryKey[0]
      return (
        head != null &&
        typeof head === 'object' &&
        '_id' in head &&
        (head as { _id: string })._id === 'listMyNotifications'
      )
    }
  })

const NotificationsPage = (): JSX.Element => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, error, isLoading, isError } = useQuery({
    ...listMyNotificationsOptions({
      query: { page, page_size: PAGE_SIZE }
    })
  })

  useEffect(() => {
    if (!data?.meta) {
      return
    }
    if (data.meta.current_page !== page) {
      setPage(data.meta.current_page)
    }
  }, [data?.meta?.current_page, page])


  const markAllMutation = useMutation({
    ...markAllMyNotificationsAsReadMutation(),
    onSuccess: () => {
      void invalidateAllNotificationListQueries(queryClient)
    }
  })


  const markOneMutation = useMutation({
    ...markOneNotificationAsReadMutation(),
    onSuccess: () => {
      void invalidateAllNotificationListQueries(queryClient)
    }
  })

  const deleteMutation = useMutation({
    ...deleteOneNotificationMutation(),
    onSuccess: () => {
      void invalidateAllNotificationListQueries(queryClient)
    }
  })

  const [pageState, setPageState] = useState<{
    menuAnchor: HTMLElement | null
    notification: NotificationItemOut | null
  }>({
    menuAnchor: null,
    notification: null
  })

  const items = data?.items ?? []
  const meta = data?.meta

  function handleMenuOpen(
    event: MouseEvent<HTMLElement>,
    notification: NotificationItemOut
  ) {
    event.currentTarget.setAttribute('aria-controls', 'notification-men')
    event.currentTarget.setAttribute('aria-expanded', 'true')

    setPageState((prev) => ({
      ...prev,
      notification,
      menuAnchor: event.currentTarget
    }))
  }

  function handleMenuClose() {
    const anchor = pageState.menuAnchor
    if (anchor) {
      anchor.removeAttribute('aria-controls')
      anchor.setAttribute('aria-expanded', 'false')
    }
    setPageState((state) => ({
      ...state,
      notification: null,
      menuAnchor: null
    }))
  }

  function onMarkAsReadClick() {
    const { notification } = pageState
    if (!notification) {
      return
    }
    markOneMutation.mutate(
      { path: { uuid: String(notification.uuid) } },
      { onSettled: () => handleMenuClose() }
    )
  }

  function onDeleteClick() {
    const { notification } = pageState
    if (!notification) {
      return
    }
    deleteMutation.mutate(
      { path: { uuid: String(notification.uuid) } },
      { onSettled: () => handleMenuClose() }
    )
  }


  function onMarkAllAsReadClick(e: MouseEvent) {
    e.preventDefault()
    markAllMutation.mutate({})
  }

  function onPaginationChange(_e: unknown, nextPage: number) {
    setPage(nextPage)
  }

  if (isLoading) {
    return <Loader />
  }
  if (isError) {
    return <div>An error occurred: {getErrorMessage(error)}</div>
  }

  if (!meta || meta.total === 0) {
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

  return (
    <SCCommon.OuterContentWrap>
      <SC.NotificationsWrap>
        <SC.NotificationsHeader>
          <Typography variant="h1">{strings.notifications}</Typography>
          {meta.unread_count > 0 && (
            <SC.MarkAsRead>
              <Link href="#" underline="always" onClick={onMarkAllAsReadClick}>
                {strings.markAllAsRead}
              </Link>
            </SC.MarkAsRead>
          )}
        </SC.NotificationsHeader>

        <SC.NotificationsList>
          {items.map((n) => (
            <SC.StyledListItem
              key={String(n.uuid)}
              alignItems="flex-start"
              sx={{
                backgroundColor: !n.is_read ? 'courseflow.lightest' : null
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
                {!n.is_read && <Badge color="primary" variant="dot" />}
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

      {meta.total_pages > 1 && (
        <SC.StyledPagination
          count={meta.total_pages}
          page={page}
          onChange={onPaginationChange}
          showFirstButton
          showLastButton
        />
      )}
    </SCCommon.OuterContentWrap>
  )
}

export default NotificationsPage
