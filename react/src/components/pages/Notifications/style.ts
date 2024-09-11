import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Pagination from '@mui/material/Pagination'
import { styled } from '@mui/material/styles'

/*******************************************************
 * STYLED COMPONENTS
 *******************************************************/
export const NotificationsWrap = styled(Box)({})

export const NotificationsHeader = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(2),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

export const MarkAsRead = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  textAlign: 'right'
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

export const StyledListItem = styled(ListItem)({
  '& > .MuiButtonBase-root': {
    paddingRight: '4em'
  }
})

export const StyledPagination = styled(Pagination)(({ theme }) => ({
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
