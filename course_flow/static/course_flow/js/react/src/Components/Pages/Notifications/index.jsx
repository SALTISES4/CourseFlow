import React, { useState } from 'react'
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

import apiData from './apiData'
import { OuterContentWrap } from '../../../mui/helper'

const NotificationsMenu = styled(Box)({})

const NotificationsHeader = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

const MarkAsRead = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
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

const NotificationsPage = () => {
  const [pagination, setPagination] = useState({
    page: 0,
    countPerPage: 10
  })
  const [anchorEl, setAnchorEl] = useState(null)
  const menuOpen = Boolean(anchorEl)

  const paginateFrom = pagination.page * pagination.countPerPage
  const paginateTo = (pagination.page + 1) * pagination.countPerPage

  function handleClick(event) {
    // a11y
    event.currentTarget.setAttribute('aria-controls', 'notification-men')
    event.currentTarget.setAttribute('aria-expanded', true)
    setAnchorEl(event.currentTarget)
  }

  function handleMenuClose() {
    // a11y
    anchorEl.removeAttribute('aria-controls', null)
    anchorEl.setAttribute('aria-expanded', false)
    setAnchorEl(null)
  }

  function onMarkAsReadClick(id) {
    console.log('onMarkAsReadClick', id)
    handleMenuClose()
  }

  function onDeleteClick(id) {
    console.log('onDeleteClick', id)
    handleMenuClose()
  }

  function onMarkAllAsReadClick(e) {
    e.preventDefault()
    console.log('mark all as read')
  }

  function onPaginationChange(e, page) {
    setPagination({
      ...pagination,
      page: page - 1
    })
  }

  return (
    <OuterContentWrap>
      <NotificationsMenu>
        <NotificationsHeader>
          <Typography variant="h1">Notifications</Typography>
          <MarkAsRead>
            <Link href={'#'} underline="always" onClick={onMarkAllAsReadClick}>
              Mark all as read
            </Link>
          </MarkAsRead>
        </NotificationsHeader>

        <NotificationsList>
          {apiData.notifications
            .slice(paginateFrom, paginateTo)
            .map((n, idx) => (
              <StyledListItem
                key={idx}
                alignItems="flex-start"
                sx={{
                  backgroundColor: n.unread ? 'primary.lightest' : null
                }}
                secondaryAction={
                  <IconButton
                    onClick={handleClick}
                    aria-label="show notifications menu"
                    aria-haspopup="true"
                  >
                    <DotsIcon />
                  </IconButton>
                }
              >
                <ListItemButton href={n.url}>
                  {n.unread && <Badge color="primary" variant="dot" />}
                  <ListItemAvatar>
                    <Avatar alt={n.from}>
                      {`${n.from.split(' ')[0][0]}${n.from.split(' ')[1][0]}`}
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
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-label': 'basic-button'
          }}
        >
          <MenuItem onClick={() => onMarkAsReadClick('id here')}>
            Mark as read
          </MenuItem>
          <MenuItem onClick={() => onDeleteClick('id here')}>Delete</MenuItem>
        </Menu>
      </NotificationsMenu>

      <StyledPagination
        count={Math.ceil(
          apiData.notifications.length / pagination.countPerPage
        )}
        page={pagination.page + 1}
        onChange={onPaginationChange}
        showFirstButton
        showLastButton
      />
    </OuterContentWrap>
  )
}

export default NotificationsPage
