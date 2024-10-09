import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Menu from '@mui/material/Menu'
import Popover from '@mui/material/Popover'
import { styled } from '@mui/material/styles'

export const TopBarWrap = styled(Box)(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: theme.palette.common.white,
    boxShadow: 'none'
  }
}))

export const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: 220,
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        marginRight: theme.spacing(1.5)
      }
    }
  }
}))

export const NotificationsMenu = styled(Popover)({
  '& .MuiPaper-root': {
    marginLeft: '3em',
    width: 500
  }
})

export const NotificationsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTypography-root:not(a)': {
    color: 'currentColor'
  }
}))

export const NotificationsList = styled(List)(({ theme }) => ({
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
