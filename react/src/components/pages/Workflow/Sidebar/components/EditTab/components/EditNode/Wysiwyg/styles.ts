import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

export const WysiwygWrap = styled(Box)(() => ({
  '& .ql-formats': {
    marginRight: '0 !important'
  },
  '& .ql-toolbar button': {
    width: '24px',
    height: '22px'
  },
  '& .ql-editor': {
    minHeight: '120px',
    '& ul, & ol': {
      paddingLeft: '4px'
    },
    '& li.ql-indent-1:not(.ql-direction-rtl)': {
      paddingLeft: '2.2em'
    },
    '& li.ql-indent-2:not(.ql-direction-rtl)': {
      paddingLeft: '2.9em'
    }
  }
}))
