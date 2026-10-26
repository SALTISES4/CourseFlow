import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

const HEADING_WIDTH = 228
const TILT_ANGLE = '50deg'
const CELL_WIDTH = 56
const CELL_HEIGHT = 50

export const TableWrap = styled(Box)(() => ({
  '&.view-normal': {},
  '&.view-matrix': {}
}))

export const TableHeader = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  display: 'flex',
  flexDirection: 'row',
  flexShrink: 0,
  zIndex: 15,
  backgroundColor: theme.palette.common.white
}))

export const HeaderLegendWrap = styled(Box, {
  shouldForwardProp: (prop) => !['tagLabel'].includes(prop as string)
})<{ tagLabel?: boolean }>(({ theme, tagLabel = false }) => ({
  position: 'relative',
  width: `${CELL_WIDTH}px`,
  height: `${HEADING_WIDTH}px`,
  padding: 0,
  transform: `rotateZ(-${TILT_ANGLE}) translate(14px, 20px)`,
  transformOrigin: 'bottom left',

  // tag labels have a fake background element that connects to the row below
  ...(tagLabel && {
    transform: `rotateZ(-${TILT_ANGLE}) translate(18px, 24px)`,
    '& span': {
      paddingTop: '2px',
      paddingBottom: '2px',
      transform: 'translateY(-8px)'
    },
    '&:after': {
      content: '""',
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '28px',
      height: '28px',
      background: '#EEF2FD',
      transform: `translate(-14px, -2px) rotateZ(${TILT_ANGLE})`,
      zIndex: -1
    }
  }),

  // empty corner cell
  '&:first-child': {
    width: `${HEADING_WIDTH}px`,
    marginRight: theme.spacing(2),
    position: 'sticky',
    left: 0,
    transform: 'none',
    zIndex: 100,
    background: 'linear-gradient(to right, #fff 60%, transparent 100%)'
  },

  '& [class*="table-legend"]': {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: `calc(${HEADING_WIDTH}px * tan(${TILT_ANGLE}))`
  },

  '&.tag-offset': {
    marginLeft: '18px'
  }
}))

export const TableBody = styled(Box)(() => ({
  width: 'fit-content'
}))

export const BodyLegendWrap = styled(Box, {
  name: 'legend-wrap'
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
  '& + [class*="legend-wrap"]': {
    zIndex: 3
  }
}))

// header or first first clumn left hand side "column/row legend" element
export const TableLegend = styled('span', {
  shouldForwardProp: (prop) => !['color', 'sx'].includes(prop as string),
  name: 'table-legend'
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
  '& [class*="body-row"]:first-child': {
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    border: 0,
    '& [class*="legend-wrap"]': {
      '&:first-child': {
        flexShrink: 0,
        zIndex: 10,
        '& [class*="table-legend"]': {
          padding: '2px'
        }
      },
      '&:last-child': {
        width: '100%',
        flexGrow: 1,
        '&:after': {
          content: '""',
          width: '100%',
          flexGrow: 1,
          height: '28px',
          background: theme.palette.workspaceBlocks.background
        }
      }
    }
  }
}))

export const BodyRow = styled(Box, { name: 'body-row' })(({ theme }) => ({
  display: 'flex',
  '.checkmarks-group': {
    borderRight: `1px solid ${theme.palette.divider}`
  },
  '&:hover .checkmarks-group': {
    backgroundColor: theme.palette.action.hover
  },
  '&.tag-header-row [class*="legend-wrap"]': {
    paddingRight: 0
  },
  '&.section-header-row:not(:first-of-type)': {
    marginTop: theme.spacing(2)
  },
  '.view-normal &:last-child > div:last-child': {
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  '.view-matrix &': {
    '&:has(+ [class*="section-header-row"])': {
      '& .checkmarks-group': {
        borderBottom: `1px solid ${theme.palette.divider}`
      },
      '& [class*="tag-bar"]::before': {
        height: '200%'
      }
    },
    '&:last-child .checkmarks-group': {
      borderBottom: `1px solid ${theme.palette.divider}`
    }
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

export const TagBarEmptyCell = styled(CheckmarkCell, { name: 'tag-bar' })(
  ({ theme }) => ({
    display: 'flex',
    border: 0,
    background: theme.palette.common.white,
    justifyContent: 'center',
    '&::before': {
      content: '""',
      position: 'relative',
      left: '-10px',
      display: 'block',
      width: '28px',
      height: '100%',
      background: '#EEF2FD'
    },

    '&.tag-offset': {
      width: '70px',
      '&::before': {
        left: 0
      }
    }
  })
)
