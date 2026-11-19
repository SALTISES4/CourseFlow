import { OuterContentWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

const COLUMN_WIDTH = 180

export const OuterScrollableWrap = styled(OuterContentWrap, {
  target: 'workflow-scrollable'
})(({ theme }) => ({
  overflow: 'auto',
  flexGrow: 1,
  '&:has([data-test-id="workflow-outcome-table-view"])::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: theme.spacing(8),
    height: '100%',
    background: theme.palette.common.white,
    zIndex: 26
  },

  '& > *': {
    width: 'fit-content'
  }
}))

export const GraphViewWrap = styled(OuterContentWrap, {
  shouldForwardProp: (prop) => prop !== 'dragging'
})<{ dragging: boolean }>(({ theme, dragging }) => ({
  padding: 0,

  '& [draggable]': {
    pointerEvents: 'auto'
  },
  ...(dragging && {
    '[data-drop-target-for-element]': {
      pointerEvents: 'auto'
    }
  })
}))

export const SectionsWrapper = styled(Box)(() => ({
  position: 'relative'
}))

export const CellRow = styled(Box, {
  shouldForwardProp: (prop) => !['stickyChannels'].includes(prop as string)
})<{ stickyChannels?: boolean }>(({ theme, stickyChannels }) => ({
  position: 'relative',
  display: 'flex',
  padding: theme.spacing(2),
  gap: theme.spacing(3),
  ...(stickyChannels && {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    background: theme.palette.common.white
  })
}))

export const Cell = styled(Box)({
  position: 'relative',
  width: `${COLUMN_WIDTH}px`,
  minHeight: '50px',
  flexShrink: 0
})
