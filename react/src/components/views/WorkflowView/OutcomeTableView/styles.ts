import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

const HEADING_WIDTH = 228
const TILT_ANGLE = '50deg'
const CELL_WIDTH = 56
const CELL_HEIGHT = 50

export const TableWrap = styled(Box)(({ theme }) => ({
  fontSize: '14px',

  '.bg-light': {
    backgroundColor: '#EEF2FD'
  },
  '.bg-dark': {
    backgroundColor: '#E5E9F4'
  },

  '&.view-normal': {
    '[class*="body-row"]:last-child > div:last-child': {
      borderBottom: `1px solid ${theme.palette.divider}`
    }
  },

  '&.view-matrix': {
    '& [class*="body-row"]': {
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
    },

    // first column's tag label needs an offset to end up with the correct spacing
    '& .tag-offset': {
      marginLeft: theme.spacing(-2)
    }
  }
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
  transform: `rotateZ(-${TILT_ANGLE}) translate(18px, 24px)`,
  transformOrigin: 'bottom left',

  // tag labels have a fake background element that connects to the row below
  ...(tagLabel && {
    width: '70px',
    transform: `rotateZ(-${TILT_ANGLE}) translate(18px, 24px)`,
    '& span': {
      paddingTop: '4px',
      paddingBottom: '4px',
      lineHeight: 1.43,
      transform: 'translate(12px, 5px)'
    },
    '&:after': {
      content: '""',
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '28px',
      height: '24px',
      background: '#EEF2FD',
      transform: `translate(-1px, 8px) rotateZ(${TILT_ANGLE})`,
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
  background: theme.palette.workspaceBlocks.background,

  // extra columns with a slightly custom legend
  '&.legend-extra': {
    maxWidth: '265px',
    paddingLeft: '8px',
    left: '8px !important',
    border: 0
  }
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
          padding: `4px 4px 4px 2px`,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0
        }
      },
      '&:last-child': {
        width: '100%',
        flexGrow: 1,
        '&:after': {
          content: '""',
          width: '100%',
          flexGrow: 1,
          height: '29px',
          borderTopRightRadius: theme.shape.borderRadius,
          borderBottomRightRadius: theme.shape.borderRadius,
          background: theme.palette.workspaceBlocks.background
        }
      }
    }
  }
}))

export const BodyRow = styled(Box, { name: 'body-row' })(({ theme }) => ({
  display: 'flex',
  '.checkmarks-group': {
    boxShadow: `inset -1px 0 0 0 ${theme.palette.divider}`
  },
  '&:not(.section-header-row):hover .checkmarks-group': {
    '&, & [class*="table-cell"]': {
      backgroundColor: theme.palette.action.hover
    }
  },
  '&.tag-header-row [class*="legend-wrap"]': {
    paddingRight: 0
  },
  '.view-matrix &.section-header-row': {
    '&:not(:first-of-type)': {
      marginTop: theme.spacing(2),

      // ... but also add a white background to cut away the tag label bar from the gap
      '[class*="legend-wrap"]:after': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: theme.spacing(-2),
        width: '100%',
        height: '100%',
        background: theme.palette.common.white,
        zIndex: -1
      }
    }
  }
}))

export const CheckmarkGroup = styled(Box)(({ theme }) => ({
  display: 'flex'
}))

export const CheckmarkCell = styled(Box)(({ theme }) => ({
  width: `${CELL_WIDTH}px`,
  height: `${CELL_HEIGHT}px`,
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `inset 1px 1px 0 0 ${theme.palette.divider}`,

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

export const TableCell = styled(CheckmarkCell, { name: 'table-cell' })(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center'
}))

export const TagBarEmptyCell = styled(CheckmarkCell, { name: 'tag-bar' })(
  ({ theme }) => ({
    display: 'flex',
    width: '70px',
    boxShadow: 'none',
    background: theme.palette.common.white,
    justifyContent: 'center',
    '&::before': {
      content: '""',
      position: 'relative',
      display: 'block',
      width: '28px',
      height: '100%',
      background: '#EEF2FD'
    }
  })
)
