import Box from '@mui/material/Box'
import { blueGrey } from '@mui/material/colors'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

export const OutcomeGroupWrap = styled(Box)(({ theme }) => ({}))

export const OutcomeGroup = styled('ul')(({ theme }) => ({
  margin: `${theme.spacing(1)} 0 0`,
  padding: 0,
  listStyle: 'none',
  '& ul': {
    marginLeft: theme.spacing(1)
  },
  '& li + li': {
    marginTop: theme.spacing(1)
  }
}))

export const OutcomeGroupItem = styled('li', {
  shouldForwardProp: (prop) => !['padded', 'level'].includes(prop as string)
})<{ padded?: boolean }>(({ theme, padded }) => ({
  position: 'relative',
  paddingRight: padded ? '28px' : 0
}))

export const OutcomeWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'dragging'
})<{ dragging?: boolean }>(({ theme, dragging }) => ({
  position: 'relative',
  width: '100%;',
  opacity: dragging ? 0.4 : 1
}))

export const OutcomeHeader = styled(Box, {
  shouldForwardProp: (prop) =>
    !['selected', 'highlighted', 'level'].includes(prop as string)
})<{ selected?: boolean; highlighted?: boolean; level: number }>(
  ({ theme, selected, highlighted, level }) => ({
    position: 'relative',
    display: 'flex',
    borderRadius: `${theme.shape.borderRadius}px`,
    flexDirection: 'row',
    flexGrow: 1,
    minWidth: 0,
    '&:hover': {
      boxShadow: `0 0 0 1px ${blueGrey[100]}`,
      cursor: 'grab'
    },
    ...(selected && {
      '&, &:hover': {
        boxShadow: `0 0 0 2px ${theme.palette.workflow.selected}`
      }
    }),
    ...(highlighted && {
      '&, &:hover': {
        boxShadow: `0 0 0 2px ${theme.palette.workflow.highlighted}`
      }
    }),
    ...(level === 0 && {
      backgroundColor: 'rgb(229, 233, 244)' // NOTE: Figma says grey[100] but it's not
    }),
    ...(level === 1 && {
      backgroundColor: 'rgb(245, 249, 255)' // NOTE: Figma says grey[50] but it's not
    }),
    ...(level === 2 && {
      border: '1px solid rgb(238, 242, 253)',
      backgroundColor: 'transparent'
    })
  })
)

export const OutcomeHeaderInner = styled(Box)(() => ({
  display: 'flex',
  gap: '1em',
  justifyContent: 'space-between',
  flexGrow: 1,
  minWidth: 0
}))

export const OutcomeHeaderToggle = styled(IconButton)(({ theme }) => ({
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

export const OutcomeTitle = styled(Typography)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(1),
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}))

export const GroupDropzone = styled('div', {
  shouldForwardProp: (prop) => !['highlight'].includes(prop as string)
})<{ highlight: boolean }>(({ theme, highlight }) => ({
  ...(highlight && {
    borderRadius: theme.shape.borderRadius,
    boxShadow: `0 0 0 2px ${theme.palette.primary.light}`
  })
}))
