import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import Paper from '@mui/material/Paper'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import AccountCircle from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AddCircleIcon from '@mui/icons-material/AddCircle'

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: 220,
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        marginRight: theme.spacing(1.5)
      }
    }
  }
}))

const TopBar = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null)
  const isAddMenuOpen = Boolean(addMenuAnchorEl)

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleAddMenuOpen = (event) => {
    setAddMenuAnchorEl(event.currentTarget)
  }

  const closeAllMenus = () => {
    setAnchorEl(null)
    setAddMenuAnchorEl(null)
  }

  const addMenu = (
    <StyledMenu
      anchorEl={addMenuAnchorEl}
      id="add-menu"
      keepMounted
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      open={isAddMenuOpen}
      onClose={closeAllMenus}
    >
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.project}
      </MenuItem>
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.program}
      </MenuItem>
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.course}
      </MenuItem>
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.activity}
      </MenuItem>
    </StyledMenu>
  )

  const accountMenu = (
    <StyledMenu
      anchorEl={anchorEl}
      id="account-menu"
      keepMounted
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      open={isMenuOpen}
      onClose={closeAllMenus}
    >
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.profile}
      </MenuItem>
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.password_reset}
      </MenuItem>
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.notification_settings}
      </MenuItem>
      <Divider />
      <MenuItem onClick={closeAllMenus}>Go to myDALITE</MenuItem>
      <MenuItem onClick={closeAllMenus}>
        <LogoutIcon /> {COURSEFLOW_APP.strings.sign_out}
      </MenuItem>
    </StyledMenu>
  )

  return (
    <Box>
      <AppBar position="static">
        <Paper>
          <Toolbar variant="dense">
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex' }}>
              <IconButton
                size="large"
                aria-label="add menu"
                aria-controls="add-menu"
                aria-haspopup="true"
                color="primary"
                onClick={handleAddMenuOpen}
              >
                <AddCircleIcon />
              </IconButton>
              <IconButton size="large" aria-label="show 1 new notifications">
                <Badge badgeContent={1} color="primary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="account-menu"
                aria-haspopup="true"
                onClick={handleMenuOpen}
              >
                <AccountCircle />
              </IconButton>
            </Box>
          </Toolbar>
        </Paper>
      </AppBar>
      {addMenu}
      {accountMenu}
    </Box>
  )
}

export default TopBar
