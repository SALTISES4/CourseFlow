import Box from '@mui/material/Box'
import { alpha, styled } from '@mui/material/styles'

export const WysiwygWrap = styled(Box, {
  shouldForwardProp: (prop) =>
    !['readOnly', 'noBorder'].includes(prop as string)
})<{ readOnly?: boolean; noBorder?: boolean }>(
  ({ theme, readOnly, noBorder }) => ({
    position: 'relative',
    '& .ql-container': {
      fontSize: readOnly ? '16px' : '14px',
      ...(noBorder && {
        border: '0 !important'
      }),
      ...(readOnly && {
        '& .ql-container': {
          borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.23)} !important`,
          borderRadius: theme.shape.borderRadius
        }
      })
    },
    '& .ql-formats': {
      marginRight: '0 !important'
    },
    '& .ql-toolbar button': {
      width: '24px',
      height: '22px'
    },
    '& .ql-editor': {
      minHeight: '120px',
      ...(noBorder && {
        paddingLeft: 0,
        paddingRight: 0
      }),

      '& ul, & ol': {
        paddingLeft: '4px'
      },
      '& li.ql-indent-1:not(.ql-direction-rtl)': {
        paddingLeft: '2.2em'
      },
      '& li.ql-indent-2:not(.ql-direction-rtl)': {
        paddingLeft: '2.9em'
      }
    },
    '& .ql-snow.ql-toolbar button:hover .ql-stroke, .ql-snow .ql-toolbar button:hover .ql-stroke, .ql-snow.ql-toolbar button:focus .ql-stroke, .ql-snow .ql-toolbar button:focus .ql-stroke, .ql-snow.ql-toolbar button.ql-active .ql-stroke, .ql-snow .ql-toolbar button.ql-active .ql-stroke, .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke, .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke, .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke, .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke, .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke, .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke, .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke, .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke, .ql-snow.ql-toolbar button:hover .ql-stroke-miter, .ql-snow .ql-toolbar button:hover .ql-stroke-miter, .ql-snow.ql-toolbar button:focus .ql-stroke-miter, .ql-snow .ql-toolbar button:focus .ql-stroke-miter, .ql-snow.ql-toolbar button.ql-active .ql-stroke-miter, .ql-snow .ql-toolbar button.ql-active .ql-stroke-miter, .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke-miter, .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke-miter, .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter, .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter, .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke-miter, .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke-miter, .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter, .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter':
      {
        color: theme.palette.primary.main
      },
    ...(readOnly && {
      '& .ql-toolbar': {
        display: 'none'
      },
      '& > span': {
        position: 'absolute',
        zIndex: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          height: '50%',
          left: '0.5em',
          right: '0em',
          top: '-50%',
          transform: 'translateY(50%)',
          zIndex: 0,
          backgroundColor: '#fff'
        }
      },
      '& .MuiFormLabel-root': {
        transform: 'translate(14px, -9px) scale(0.75)'
      }
    })
  })
)
