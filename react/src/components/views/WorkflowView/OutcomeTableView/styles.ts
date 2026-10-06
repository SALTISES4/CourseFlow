import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

const HEADING_WIDTH = 228
const TILT_ANGLE = '50deg'
const CELL_WIDTH = 56
const CELL_HEIGHT = 50

export const TableWrap = styled(Box)(() => ({}))

export const TableHeader = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  display: 'flex',
  flexDirection: 'row',
  flexShrink: 0,
  zIndex: 15,
  backgroundColor: theme.palette.common.white
}))

export const HeaderLegendWrap = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: `${CELL_WIDTH}px`,
  height: `${HEADING_WIDTH}px`,
  padding: 0,

  // empty corner cell
  '&:first-child': {
    width: `${HEADING_WIDTH}px`,
    marginRight: theme.spacing(2)
  },

  // diagonal headers
  '& [class*="TableLegend"]': {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: `calc(${HEADING_WIDTH}px * tan(${TILT_ANGLE}))`,
    transform: `rotate(-${TILT_ANGLE}) translate(-11px, 8px)`,
    transformOrigin: 'top left'
  }
}))

export const TableBody = styled(Box)(() => ({}))

export const BodyLegendWrap = styled(Box, {
  name: 'LegendWrap'
})(({ theme }) => ({
  position: 'sticky',
  left: 0,
  display: 'flex',
  width: `calc(${HEADING_WIDTH}px + ${theme.spacing(2)})`,
  minHeight: `${CELL_HEIGHT}px`,
  paddingRight: theme.spacing(2),
  alignItems: 'center',
  backgroundColor: theme.palette.common.white,
  zIndex: 10,
  '& + [class*="LegendWrap"]': {
    zIndex: 3
  }
}))

// header or first first clumn left hand side "column/row legend" element
export const TableLegend = styled('span', {
  shouldForwardProp: (prop) => !['color'].includes(prop as string),
  name: 'TableLegend'
})<{ color?: string }>(({ theme, color }) => ({
  display: 'block',
  flexGrow: 1,
  padding: '6px',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  borderLeft: `${theme.spacing(1)} solid ${color || 'transparent'}`,
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.workspaceBlocks.background
}))

// tag group header / full row body splitter
export const TagGroup = styled(Box)(({ theme }) => ({
  '& [class*="BodyRow"]:first-child': {
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    border: 0,
    '& [class*="LegendWrap"]': {
      '&:first-child': {
        flexShrink: 0,
        zIndex: 10,
        '& [class*="TableLegend"]': {
          padding: theme.spacing(0.5)
        }
      },
      '&:last-child': {
        width: '100%',
        flexGrow: 1,
        '&:after': {
          content: '""',
          width: '100%',
          flexGrow: 1,
          height: '32px',
          background: theme.palette.workspaceBlocks.background
        }
      }
    }
  }
}))

export const BodyRow = styled(Box, { name: 'BodyRow' })(({ theme }) => ({
  display: 'flex',
  borderRight: `1px solid ${theme.palette.divider}`,
  '&:hover .Checkmarks-root': {
    backgroundColor: theme.palette.action.hover
  },
  '&:last-child > div:last-child': {
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  '&.Tagheader-root [class*="LegendWrap"]': {
    paddingRight: 0
  }
}))

export const CheckmarkGroup = styled(Box)(({ theme }) => ({
  display: 'flex'
}))

export const CheckmarkCell = styled(Box)(({ theme }) => ({
  width: `${CELL_WIDTH}px`,
  height: `${CELL_HEIGHT}px`,
  border: `1px solid ${theme.palette.divider}`,
  borderBottomWidth: 0,
  borderRightWidth: 0,
  alignItems: 'center',
  justifyContent: 'center',

  // hide the checkbox rectangle for the elements in "empty" state
  '&:not(:has(input)):not(:hover) span': {
    opacity: 0,
    transform: 'scale(0.85)'
  },

  '&:hover span': {
    borderColor: theme.palette.primary.main
  },
  '& label': {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    padding: '6px 8px',
    cursor: 'pointer'
  },
  '& input': {
    position: 'absolute',
    left: 0,
    opacity: 0,
    '& ~ span': {
      color: '#8AD6AD'
    },
    '&:checked ~ span': {
      color: theme.palette.primary.dark
    }
  },
  '& span': {
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #EEF2FD',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.common.white,
    transition: `opacity 0.1s ease, transform 0.1s ease`
  }
}))
