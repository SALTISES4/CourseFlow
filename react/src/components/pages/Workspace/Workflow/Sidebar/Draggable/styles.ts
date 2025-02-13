import Box from '@mui/material/Box'
import { blueGrey, yellow } from '@mui/material/colors'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'

export const DraggableWrap = styled(Box, {
  shouldForwardProp: (prop) =>
    !['group', 'highlight', 'typeColor', 'dashed'].includes(prop as string)
})<{ dashed?: boolean; highlight?: boolean; typeColor?: string }>(
  ({ theme, highlight, dashed, typeColor }) => ({
    display: 'flex',
    flexDirection: 'row',
    borderRadius: `${theme.shape.borderRadius}px`,
    borderLeft: `${theme.spacing(1)} solid`,
    borderLeftColor: typeColor || '#000',
    backgroundColor: theme.palette.workspaceBlocks.background,
    '&:hover': {
      boxShadow: `0 0 0 1px ${blueGrey[100]}`,
      cursor: 'grab'
    },
    ...(highlight && {
      '&, &:hover': {
        boxShadow: `0 0 0 2px ${yellow[800]}`
      }
    }),
    ...(dashed && {
      '&, &:hover': {
        border: '1px dashed currentColor',
        paddingLeft: theme.spacing(1),
        backgroundColor: 'transparent'
      }
    })
  })
)

export const DraggableDragWrap = styled('div')(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(1),
  flexGrow: 1,
  minWidth: 0,
  '& .MuiTypography-root': {
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}))

export const DraggableDragHandle = styled('div')(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%'
}))

export const DraggableBlockToggle = styled(IconButton)(({ theme }) => ({
  marginLeft: 'auto',
  border: 0,
  padding: `0 ${theme.spacing(1)}`,
  borderLeft: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  background: 'transparent',
  flexShrink: 0,
  transition: 'color 0.15s ease',
  cursor: 'pointer',
  color: theme.palette.primary.main,
  '&:hover': {
    background: 'transparent',
    color: theme.palette.primary.dark
  }
}))
